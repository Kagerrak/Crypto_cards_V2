import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { useNavigate } from "react-router-dom";
import { ApolloClient, InMemoryCache } from "@apollo/client";

import { GET_CHARACTERS } from "../constants";
import { GetParams } from "../utils/Onboard.js";
import {
  characterContractAddress,
  characterContractABI,
  battleSkillsAddress,
  battleSkillsABI,
  battleItemsAddress,
  battleItemsABI,
  battleContractAddress,
  battleContractABI,
  battleEffectsAddress,
  battleEffectsABI,
  compositeTokensAddress,
  compositeTokensABI,
  equipManagementAddress,
  equipManagementABI,
} from "../contract";

import { createEventListeners } from "./createEventListeners";

const GlobalContext = createContext();

export const GlobalContextProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [battleGround, setBattleGround] = useState("bg-astral");
  const [characterContract, setCharacterContract] = useState(null);
  const [battleSkillsContract, setBattleSkillsContract] = useState(null);
  const [battleItemsContract, setBattleItemsContract] = useState(null);
  const [battleEffectsContract, setBattleEffectsContract] = useState(null);
  const [compositeContract, setCompositeContract] = useState(null);
  const [equipManagementContract, setEquipManagementContract] = useState(null);
  const [battleContract, setBattleContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [step, setStep] = useState(1);
  const [gameData, setGameData] = useState({
    players: [],
    pendingBattles: [],
    activeBattle: null,
  });
  const [showAlert, setShowAlert] = useState({
    status: false,
    type: "info",
    message: "",
  });
  const [battleName, setBattleName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [updateGameData, setUpdateGameData] = useState(0);
  const [equippedSkills, setEquippedSkills] = useState([null, null, null]);
  const [equippedSkillLoading, setEquippedSkillLoading] = useState(false);
  const [localOwnedSkills, setLocalOwnedSkills] = useState([]);
  const [allOwnedSkills, setAllOwnedSkills] = useState([]);
  const [equippedItems, setEquippedItems] = useState({
    Headgear: null,
    Weapon: null,
    BodyArmor: null,
    Pants: null,
    Footwear: null,
  });
  const [equippedItemLoading, setEquippedItemLoading] = useState(false);
  const [localOwnedItems, setLocalOwnedItems] = useState([]);
  const [allOwnedItems, setAllOwnedItems] = useState([]);

  const [shouldPoll, setShouldPoll] = useState(false);
  const [shouldPollPlayerData, setShouldPollPlayerData] = useState(false);

  const navigate = useNavigate();

  const intervalIdRef = useRef();

  const [battleIsOver, setBattleIsOver] = useState(false);
  const [damagedPlayers, setDamagedPlayers] = useState([]);

  //* Set battleground to local storage
  useEffect(() => {
    const isBattleground = localStorage.getItem("battleground");

    if (isBattleground) {
      setBattleGround(isBattleground);
    } else {
      localStorage.setItem("battleground", battleGround);
    }
  }, []);

  //* Reset web3 onboarding modal params
  useEffect(() => {
    const resetParams = async () => {
      const currentStep = await GetParams();

      setStep(currentStep.step);
    };

    resetParams();

    window?.ethereum?.on("chainChanged", () => resetParams());
    window?.ethereum?.on("accountsChanged", () => resetParams());
  }, []);

  //* Set the wallet address to the state
  const updateCurrentWalletAddress = async () => {
    const accounts = await window?.ethereum?.request({
      method: "eth_requestAccounts",
    });

    if (accounts) setWalletAddress(accounts[0]);

    navigate("/");
  };

  useEffect(() => {
    updateCurrentWalletAddress();

    window?.ethereum?.on("accountsChanged", updateCurrentWalletAddress);
  }, []);

  //* Set the smart contracts and provider to the state
  useEffect(() => {
    const setSmartContractsAndProvider = async () => {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const newProvider = new ethers.providers.Web3Provider(connection);
      const signer = newProvider.getSigner();

      const newCharacterContract = new ethers.Contract(
        characterContractAddress,
        characterContractABI,
        signer
      );
      const newBattleSkillsContract = new ethers.Contract(
        battleSkillsAddress,
        battleSkillsABI,
        signer
      );
      const newBattleItemsContract = new ethers.Contract(
        battleItemsAddress,
        battleItemsABI,
        signer
      );
      const newBattleEffectsContract = new ethers.Contract(
        battleEffectsAddress,
        battleEffectsABI,
        signer
      );
      const newCompositeContract = new ethers.Contract(
        compositeTokensAddress,
        compositeTokensABI,
        signer
      );
      const newEquipManagementContract = new ethers.Contract(
        equipManagementAddress,
        equipManagementABI,
        signer
      );
      const newBattleContract = new ethers.Contract(
        battleContractAddress,
        battleContractABI,
        signer
      );

      setProvider(newProvider);
      setCharacterContract(newCharacterContract);
      setBattleSkillsContract(newBattleSkillsContract);
      setBattleItemsContract(newBattleItemsContract);
      setBattleContract(newBattleContract);
      setBattleEffectsContract(newBattleEffectsContract);
      setCompositeContract(newCompositeContract);
      setEquipManagementContract(newEquipManagementContract);
    };

    setSmartContractsAndProvider();
  }, [walletAddress]);

  // Define fetchGameData
  const fetchGameData = async () => {
    console.log("fetchGameData is being called");

    if (battleContract) {
      try {
        let activeBattlesId;
        let retries = 3;
        while (retries) {
          try {
            activeBattlesId = await battleContract.getActiveBattlesId();
            break;
          } catch (e) {
            if (retries === 1) throw e; // If it's the last retry, throw the error
            retries--;
            console.warn(
              `Error fetching active battles id. Retries left: ${retries}`
            );
            await new Promise((r) => setTimeout(r, 2000)); // wait for 2 seconds before the next retry
          }
        }

        const fetchedBattles = await Promise.all(
          activeBattlesId.map((id) => battleContract.getBattle(id))
        );
        const pendingBattles = fetchedBattles.filter(
          (battle) => battle.battleStatus === 0
        );
        let activeBattle = null;
        fetchedBattles.forEach((battle) => {
          if (
            battle.players.find(
              (player) => player.toLowerCase() === walletAddress.toLowerCase()
            )
          ) {
            if (battle.winner.startsWith("0x00") && battle.battleStatus !== 2) {
              activeBattle = battle;
            }
          }
        });

        console.log("Fetched game data:", {
          pendingBattles: pendingBattles,
          activeBattle,
        });

        // Check if the game data has changed
        if (
          JSON.stringify(gameData.pendingBattles) !==
            JSON.stringify(pendingBattles) ||
          JSON.stringify(gameData.activeBattle) !== JSON.stringify(activeBattle)
        ) {
          // If the game data has changed, stop polling
          setShouldPoll(false);

          // Clear the interval
          if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
            intervalIdRef.current = null;
          }
        }

        setGameData({
          pendingBattles: pendingBattles,
          activeBattle,
        });
      } catch (error) {
        console.error("Error fetching game data:", error);
        setErrorMessage(`Error fetching game data: ${error.message}`);

        // Show an alert with the error message
        setShowAlert({
          status: true,
          type: "failure",
          message: `Error fetching game data: ${error.message}`,
        });
      }
    }
  };

  // Use fetchGameData in useEffect
  useEffect(() => {
    // Only call fetchGameData if battleContract is not null
    if (battleContract) {
      // Call fetchGameData once on mount or when shouldPoll changes
      fetchGameData();

      if (shouldPoll) {
        // Start polling
        intervalIdRef.current = setInterval(fetchGameData, 5000);
      }
    }

    return () => {
      // Stop polling
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [shouldPoll, battleContract, updateGameData, walletAddress]); // Add dependencies

  //* Activate event listeners for the smart contract
  useEffect(() => {
    if (step === -1 && battleContract) {
      createEventListeners({
        navigate,
        battleContractAddress,
        characterContractAddress,
        provider,
        walletAddress,
        setShowAlert,
        setUpdateGameData,
        fetchGameData,
        setShouldPoll,
        setShouldPollPlayerData,
        battleIsOver,
        setBattleIsOver,
        damagedPlayers,
        setDamagedPlayers,
      });
    }
  }, [step, battleContract]);

  //* Handle alerts
  useEffect(() => {
    if (showAlert?.status) {
      const timer = setTimeout(() => {
        setShowAlert({ status: false, type: "info", message: "" });
      }, [5000]);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  //* Handle error messages
  useEffect(() => {
    if (errorMessage) {
      const parsedErrorMessage = errorMessage.reason;
      if (parsedErrorMessage) {
        setShowAlert({
          status: true,
          type: "failure",
          message: parsedErrorMessage,
        });
      }
    }
  }, [errorMessage]);

  return (
    <GlobalContext.Provider
      value={{
        battleGround,
        setBattleGround,
        characterContract,
        battleSkillsContract,
        battleItemsContract,
        battleEffectsContract,
        compositeContract,
        equipManagementContract,
        battleContract,
        gameData,
        walletAddress,
        updateCurrentWalletAddress,
        showAlert,
        setShowAlert,
        battleName,
        setBattleName,
        errorMessage,
        setErrorMessage,
        equippedSkills,
        setEquippedSkills,
        equippedSkillLoading,
        setEquippedSkillLoading,
        localOwnedSkills,
        setLocalOwnedSkills,
        equippedItems,
        setEquippedItems,
        localOwnedItems,
        setLocalOwnedItems,
        equippedItemLoading,
        setEquippedItemLoading,
        allOwnedSkills,
        setAllOwnedSkills,
        allOwnedItems,
        setAllOwnedItems,
        fetchGameData,
        battleIsOver,
        setBattleIsOver,
        damagedPlayers,
        setDamagedPlayers,
        shouldPollPlayerData,
        setShouldPollPlayerData,
        setShouldPoll,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);

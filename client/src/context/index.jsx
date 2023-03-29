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
} from "../contract";

import { createEventListeners } from "./createEventListeners";

const GlobalContext = createContext();

export const GlobalContextProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [battleGround, setBattleGround] = useState("bg-astral");
  const [characterContract, setCharacterContract] = useState(null);
  const [battleSkillsContract, setBattleSkillsContract] = useState(null);
  const [battleItemsContract, setBattleItemsContract] = useState(null);
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

  const player1Ref = useRef();
  const player2Ref = useRef();

  const navigate = useNavigate();

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
    };

    setSmartContractsAndProvider();
  }, [walletAddress]);

  //* Activate event listeners for the smart contract
  useEffect(() => {
    if (step === -1 && battleContract) {
      createEventListeners({
        navigate,
        contract: battleContract,
        provider,
        walletAddress,
        setShowAlert,
        player1Ref,
        player2Ref,
        setUpdateGameData,
      });
    }
  }, [step, battleContract]);

  //* Set the game data to the state
  useEffect(() => {
    const fetchGameData = async () => {
      if (battleContract) {
        const fetchedBattles = await battleContract.getAllBattles();
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

        setGameData({ pendingBattles: pendingBattles.slice(1), activeBattle });
      }
    };

    fetchGameData();
  }, [battleContract, updateGameData, walletAddress]);

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
        player1Ref,
        player2Ref,
        battleGround,
        setBattleGround,
        characterContract,
        battleSkillsContract,
        battleItemsContract,
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
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);

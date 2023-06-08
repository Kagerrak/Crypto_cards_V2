import { ThirdwebSDK } from "@thirdweb-dev/sdk/evm";
import { playAudio, sparcle } from "../utils/animation.js";
import { defenseSound } from "../assets";

//* Get battle card coordinates
const getCoords = (cardRef) => {
  const { left, top, width, height } = cardRef.current.getBoundingClientRect();

  return {
    pageX: left + width / 2,
    pageY: top + height / 2.25,
  };
};

const emptyAccount = "0x0000000000000000000000000000000000000000";

export const createEventListeners = async ({
  navigate,
  battleContractAddress,
  characterContractAddress,
  walletAddress,
  setShowAlert,
  player1Ref,
  player2Ref,
  setUpdateGameData,
}) => {
  const sdk = new ThirdwebSDK("mumbai");
  const battleContract = await sdk.getContract(battleContractAddress);
  const characterContract = await sdk.getContract(characterContractAddress);
  // NewCharacter event listener
  characterContract.events.addEventListener("NewCharacter", (event) => {
    console.log("New player created!", event);

    if (walletAddress === event.data.owner) {
      setShowAlert({
        status: true,
        type: "success",
        message: "Player has been successfully registered",
      });
    }
  });

  // BattleCreated event listener
  battleContract.events.addEventListener("BattleCreated", (event) => {
    console.log("Battle created!", event, walletAddress);

    setUpdateGameData((prevUpdateGameData) => prevUpdateGameData + 1);
  });

  // BattleCancelled event listener
  battleContract.events.addEventListener("BattleCancelled", (event) => {
    console.log("Battle Cancelled!", event, walletAddress);

    setUpdateGameData((prevUpdateGameData) => prevUpdateGameData + 1);
  });

  // NewBattle event listener
  battleContract.events.addEventListener("NewBattle", (event) => {
    console.log("New battle started!", event, walletAddress);

    if (
      walletAddress.toLowerCase() === event.data.player1.toLowerCase() ||
      walletAddress.toLowerCase() === event.data.player2.toLowerCase()
    ) {
      console.log(
        "Navigating to battle from NewBattle event listener:",
        event.data.battleName
      );
      navigate(`/battle/${event.data.battleName}`);
    }

    setUpdateGameData((prevUpdateGameData) => prevUpdateGameData + 1);
  });

  // MoveSubmitted event listener
  battleContract.events.addEventListener("MoveSubmitted", (event) => {
    console.log("Battle move initiated!", event);
  });

  // RoundEnded event listener
  battleContract.events.addEventListener("RoundEnded", (event) => {
    console.log("Round ended!", event, walletAddress);

    if (event.data && event.data.damagedPlayers) {
      for (let i = 0; i < event.data.damagedPlayers.length; i += 1) {
        if (event.data.damagedPlayers[i] !== emptyAccount) {
          if (event.data.damagedPlayers[i] === walletAddress) {
            sparcle(getCoords(player1Ref));
            console.log("sparcled", i, player1Ref);
          } else if (event.data.damagedPlayers[i] !== walletAddress) {
            sparcle(getCoords(player2Ref));
            console.log("sparcled", i, player2Ref);
          }
        } else {
          playAudio(defenseSound);
        }
      }
    }

    setUpdateGameData((prevUpdateGameData) => prevUpdateGameData + 1);
  });

  // BattleEnded event listener
  battleContract.events.addEventListener("BattleEnded", (event) => {
    if (walletAddress.toLowerCase() === event.data.winner.toLowerCase()) {
      setShowAlert({ status: true, type: "success", message: "You won!" });
      console.log("You won!");
    } else if (walletAddress.toLowerCase() === event.data.loser.toLowerCase()) {
      setShowAlert({ status: true, type: "failure", message: "You lost!" });
      console.log("You lost!");
    }

    // Update gameData state to indicate that the battle has ended
    setUpdateGameData((prevUpdateGameData) => prevUpdateGameData + 1);

    console.log("Navigating to homepage from BattleEnded event listener");
    navigate("/create-battle");
  });
};

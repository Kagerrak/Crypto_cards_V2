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
  fetchGameData,
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

    if (walletAddress.toLowerCase() === event.data.player1.toLowerCase()) {
      console.log("About to call fetchGameData"); // Add this line

      let countdown = 5;
      const countdownInterval = setInterval(() => {
        console.log(`Fetching game data in ${countdown} seconds...`);
        countdown -= 1;
      }, 1000);

      // Add a delay before fetching game data
      setTimeout(async () => {
        clearInterval(countdownInterval);
        await fetchGameData();

        console.log(
          "Navigating to battle from NewBattle event listener:",
          event.data.battleName
        );
        navigate(`/battle/${event.data.battleName}`);
      }, 5000); // Adjust the delay as needed
    }
  });

  // MoveSubmitted event listener
  battleContract.events.addEventListener("MoveSubmitted", (event) => {
    console.log("Battle move initiated!", event);
  });

  // Process a RoundEnded event
  const processEvent = (event) => {
    console.log("Round ended!", event, walletAddress);

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

    setUpdateGameData((prevUpdateGameData) => prevUpdateGameData + 1);
  };

  // Listen for new RoundEnded events
  battleContract.events.addEventListener("RoundEnded", async (event) => {
    // Get the battleId and round from the event
    const { battleId, round } = event.data;

    // Fetch the event with the specific battleId and round
    const events = await battleContract.events.getEvents("RoundEnded", {
      filters: {
        battleId: battleId,
        round: round,
      },
    });

    // Process each event (there should only be one)
    events.forEach(processEvent);
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

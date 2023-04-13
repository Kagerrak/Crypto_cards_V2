import { ethers } from "ethers";
import { characterContractABI, battleContractABI } from "../contract";
import { playAudio, sparcle } from "../utils/animation.js";
import { defenseSound } from "../assets";

const AddNewEvent = (eventFilter, provider, ABI, cb) => {
  console.log("AddNewEvent");
  provider.removeListener(eventFilter);

  provider.on(eventFilter, (logs) => {
    const parsedLog = new ethers.utils.Interface(ABI).parseLog(logs);
    console.log(parsedLog);

    cb(parsedLog);
  });
};

//* Get battle card coordinates
const getCoords = (cardRef) => {
  const { left, top, width, height } = cardRef.current.getBoundingClientRect();

  return {
    pageX: left + width / 2,
    pageY: top + height / 2.25,
  };
};

const emptyAccount = "0x0000000000000000000000000000000000000000";

export const createEventListeners = ({
  navigate,
  characterContract,
  battleContract,
  provider,
  walletAddress,
  setShowAlert,
  player1Ref,
  player2Ref,
  setUpdateGameData,
}) => {
  const NewPlayerEventFilter = characterContract.filters.NewCharacter();
  AddNewEvent(
    NewPlayerEventFilter,
    provider,
    characterContractABI,
    ({ args }) => {
      console.log("New player created!", args);

      if (walletAddress === args.owner) {
        setShowAlert({
          status: true,
          type: "success",
          message: "Player has been successfully registered",
        });
      }
    }
  );

  const BattleCreatedEventFilter = battleContract.filters.BattleCreated();
  AddNewEvent(
    BattleCreatedEventFilter,
    provider,
    battleContractABI,
    ({ args }) => {
      console.log("Battle created!", args, walletAddress);

      setUpdateGameData((prevUpdateGameData) => prevUpdateGameData + 1);
    }
  );

  const BattleCancelledEventFilter = battleContract.filters.BattleCancelled();
  AddNewEvent(
    BattleCancelledEventFilter,
    provider,
    battleContractABI,
    ({ args }) => {
      console.log("Battle Cancelled!", args, walletAddress);

      setUpdateGameData((prevUpdateGameData) => prevUpdateGameData + 1);
    }
  );

  const NewBattleEventFilter = battleContract.filters.NewBattle();
  AddNewEvent(NewBattleEventFilter, provider, battleContractABI, ({ args }) => {
    console.log("New battle started!", args, walletAddress);

    console.log("walletAddress:", walletAddress.toLowerCase());
    console.log("player1:", args.player1.toLowerCase());
    console.log("player2:", args.player2.toLowerCase());

    if (
      walletAddress.toLowerCase() === args.player1.toLowerCase() ||
      walletAddress.toLowerCase() === args.player2.toLowerCase()
    ) {
      console.log(
        "Navigating to battle from NewBattle event listener:",
        args.battleName
      );
      navigate(`/battle/${args.battleName}`);
    }

    setUpdateGameData((prevUpdateGameData) => prevUpdateGameData + 1);
  });

  // const NewGameTokenEventFilter = contract.filters.NewGameToken();
  // AddNewEvent(
  //   NewGameTokenEventFilter,
  //   provider,
  //   characterContractABI,
  //   ({ args }) => {
  //     console.log("New game token created!", args.owner);

  //     if (walletAddress.toLowerCase() === args.owner.toLowerCase()) {
  //       setShowAlert({
  //         status: true,
  //         type: "success",
  //         message: "Player game token has been successfully generated",
  //       });

  //       navigate("/create-battle");
  //     }
  //   }
  // );

  const BattleMoveEventFilter = battleContract.filters.MoveSubmitted();
  AddNewEvent(
    BattleMoveEventFilter,
    provider,
    battleContractABI,
    ({ args }) => {
      console.log("Battle move initiated!", args);
    }
  );

  const RoundEndedEventFilter = battleContract.filters.RoundEnded();
  AddNewEvent(
    RoundEndedEventFilter,
    provider,
    battleContractABI,
    ({ args }) => {
      console.log("Round ended!", args, walletAddress);

      for (let i = 0; i < args.damagedPlayers.length; i += 1) {
        if (args.damagedPlayers[i] !== emptyAccount) {
          if (args.damagedPlayers[i] === walletAddress) {
            sparcle(getCoords(player1Ref));
            console.log("sparcled", i, player1Ref);
          } else if (args.damagedPlayers[i] !== walletAddress) {
            sparcle(getCoords(player2Ref));
            console.log("sparcled", i, player2Ref);
          }
        } else {
          playAudio(defenseSound);
        }
      }

      setUpdateGameData((prevUpdateGameData) => prevUpdateGameData + 1);
    }
  );

  // Battle Ended event listener
  const BattleEndedEventFilter = battleContract.filters.BattleEnded();
  AddNewEvent(
    BattleEndedEventFilter,
    provider,
    battleContractABI,
    ({ args }) => {
      if (walletAddress.toLowerCase() === args.winner.toLowerCase()) {
        setShowAlert({ status: true, type: "success", message: "You won!" });
        console.log("You won!");
      } else if (walletAddress.toLowerCase() === args.loser.toLowerCase()) {
        setShowAlert({ status: true, type: "failure", message: "You lost!" });
        console.log("You lost!");
      }

      // Update gameData state to indicate that the battle has ended
      setUpdateGameData((prevUpdateGameData) => prevUpdateGameData + 1);

      console.log("Navigating to homepage from BattleEnded event listener");
      navigate("/create-battle");
    }
  );
};

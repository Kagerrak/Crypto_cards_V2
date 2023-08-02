import { ThirdwebSDK } from "@thirdweb-dev/sdk/evm";

// import { ApolloClient, InMemoryCache } from "@apollo/client";

// import { GET_CHARACTERS } from "../constants";
// import { playAudio, sparcle } from "../utils/animation.js";
// import { defenseSound } from "../assets";
// import { GET_MOVE } from "../constants/subgraphQueries";

// const client = new ApolloClient({
//   uri: "https://api.studio.thegraph.com/query/37725/wiwa/version/latest",
//   cache: new InMemoryCache(),
// });

// async function fetchData() {
//   try {
//     const { data } = await client.query({ query: GET_CHARACTERS });

//     console.log(data);
//   } catch (error) {
//     console.error("An error occurred while fetching the data:", error);
//   }
// }

// async function fetchMove() {
//   try {
//     const { data } = await client.query({ query: GET_MOVE });

//     console.log(data);
//   } catch (error) {
//     console.error("An error occurred while fetching the data:", error);
//   }
// }

export const createEventListeners = async ({
  navigate,
  battleContractAddress,
  characterContractAddress,
  walletAddress,
  setShowAlert,
  setUpdateGameData,
  fetchGameData,
  setShouldPoll,
  setShouldPollPlayerData,
  setBattleIsOver,
  setDamagedPlayers,
}) => {
  const sdk = new ThirdwebSDK("mumbai", {
    clientId: "bff01b72dc0921cd7e72c3c69b40436e",
  });
  const provider = sdk.getProvider();
  const battleContract = await sdk.getContract(battleContractAddress);
  const characterContract = await sdk.getContract(characterContractAddress);

  // NewCharacter event listener
  characterContract.events.addEventListener("NewCharacter", (event) => {
    console.log("New player created!", event);

    // fetchData();

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
  battleContract.events.addEventListener("NewBattle", async (event) => {
    console.log("New battle started!", event, walletAddress);

    if (walletAddress.toLowerCase() === event.data.player1.toLowerCase()) {
      console.log("About to call fetchGameData");

      setBattleIsOver(false);

      // Get the transaction hash from the event
      const { transactionHash } = event.transaction;

      // Function to wait for the transaction to be mined
      const waitForTransaction = async (hash) => {
        const receipt = await provider.getTransactionReceipt(hash);
        if (receipt === null) {
          // Transaction is not yet mined, try again later
          setTimeout(() => waitForTransaction(hash), 1000);
        } else {
          // Transaction has been mined, proceed with the rest of the code

          await fetchGameData();

          console.log(
            "Navigating to battle from NewBattle event listener:",
            event.data.battleName
          );
          navigate(`/battle/${event.data.battleName}`);
        }
      };

      // Start waiting for the transaction
      waitForTransaction(transactionHash);
    }
  });

  // QuitBattle event listener
  battleContract.events.addEventListener("BattleQuit", async (event) => {
    console.log("Battle quit!", event, walletAddress);

    if (walletAddress.toLowerCase() === event.data.quitter.toLowerCase()) {
      console.log("About to call fetchGameData");

      // Get the transaction hash from the event
      const { transactionHash } = event.transaction;

      // Function to wait for the transaction to be mined
      const waitForTransaction = async (hash) => {
        const receipt = await provider.getTransactionReceipt(hash);
        if (receipt === null) {
          // Transaction is not yet mined, try again later
          setTimeout(() => waitForTransaction(hash), 1000);
        } else {
          // Transaction has been mined, proceed with the rest of the code

          await fetchGameData();

          console.log(
            "Navigating to create battle from QuitBattle event listener:",
            event.data.battleName
          );
          navigate("/create-battle");
        }
      };

      // Start waiting for the transaction
      waitForTransaction(transactionHash);
    }
  });

  // MoveSubmitted event listener
  battleContract.events.addEventListener("MoveSubmitted", (event) => {
    console.log("Battle move initiated!", event);
    const { move, player } = event.data;

    let message;
    if (player.toLowerCase() !== walletAddress.toLowerCase()) {
      message = `Opponent initiating ${
        move === 0 ? "attack" : move === 1 ? "defense" : "skill"
      }`;
    } else {
      message = `Initiating ${
        move === 0 ? "attack" : move === 1 ? "defense" : "skill"
      }`;
    }

    setShowAlert({
      status: true,
      type: "info",
      message,
    });

    // fetchMove();
  });

  // Listen for new RoundEnded events
  battleContract.events.addEventListener("RoundEnded", async (event) => {
    // Get the transaction hash from the event
    const { transactionHash } = event.transaction;

    // Function to wait for the transaction to be mined
    const waitForTransaction = async (hash) => {
      const receipt = await provider.getTransactionReceipt(hash);
      if (receipt === null) {
        // Wait for 1 second before trying again
        setTimeout(() => waitForTransaction(hash), 1000);
      } else {
        // Transaction has been mined, proceed with the rest of the code
        // Get the battleId and round from the event
        const { battleId, round } = event.data;

        // Fetch the event with the specific battleId and round
        const events = await battleContract.events.getEvents("RoundEnded", {
          fromBlock: event.transaction.blockNumber,
          filters: {
            battleId: battleId,
            round: round,
          },
        });

        // Process each event (there should only be one)
        events.forEach((e) => {
          setDamagedPlayers(e.data.damagedPlayers);
        });

        // Start polling for data
        // setShouldPoll(true);
        setShouldPollPlayerData(true);
      }
    };

    // Start waiting for the transaction
    waitForTransaction(transactionHash);
  });

  // BattleEnded event listener
  // BattleEnded event listener
  battleContract.events.addEventListener("BattleEnded", async (event) => {
    console.log("BattleEnded event listener");
    // Get the transaction hash from the event
    const { transactionHash } = event.transaction;

    // Function to wait for the transaction to be mined
    const waitForTransaction = async (hash) => {
      const receipt = await provider.getTransactionReceipt(hash);
      if (receipt === null) {
        // Wait for 1 second before trying again
        setTimeout(() => waitForTransaction(hash), 1000);
      } else {
        // Transaction has been mined, proceed with the rest of the code

        setBattleIsOver(true);
        console.log("Polling set to false");

        // console.log("Navigating to homepage from BattleEnded event listener");
        // navigate("/create-battle");
      }
    };

    // Start waiting for the transaction
    waitForTransaction(transactionHash);
  });
};

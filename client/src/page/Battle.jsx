import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import styles from "../styles";
import {
  ActionButton,
  Alert,
  Card,
  GameInfo,
  PlayerInfo,
  Loader,
  StatusEffect,
  BattleLog,
  BattleSummaryModal,
} from "../components";
import { useGlobalContext } from "../context";
import {
  attack,
  attackSound,
  characters,
  defense,
  defenseSound,
  player01 as player01Icon,
  player02 as player02Icon,
} from "../assets";
import { playAudio, sparcle } from "../utils/animation.js";
import { skills } from "../assets/skills";

const emptyAccount = "0x0000000000000000000000000000000000000000";

const Player = {
  att: null,
  def: null,
  health: null,
  mana: null,
  equippedSkills: null,
  activeEffectIds: null,
  activeEffectDurations: null,
};

const Battle = () => {
  const {
    battleContract,
    gameData,
    battleGround,
    walletAddress,
    setErrorMessage,
    showAlert,
    setShowAlert,
    battleIsOver,
    setBattleIsOver,
    damagedPlayers,
    setDamagedPlayers,
    shouldPollPlayerData,
    setShouldPollPlayerData,
    fetchGameData,
  } = useGlobalContext();

  const player1Ref = useRef();
  const player2Ref = useRef();
  const playerIntRef = useRef();

  const [state, setState] = useState({
    player1: { ...Player },
    player2: { ...Player },
    playersLoaded: false,
    character: null,
    p1InitHP: null,
    p2InitHP: null,
    battleId: null,
  });

  const getCoords = (cardRef) => {
    if (cardRef.current) {
      const { left, top, width, height } =
        cardRef.current.getBoundingClientRect();
      return {
        pageX: left + width / 2,
        pageY: top + height / 2.25,
      };
    }
    return null;
  };

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [battleSummary, setBattleSummary] = useState(null);

  const [playerData, setPlayerData] = useState({
    player1Data: null,
    player2Data: null,
  });

  const [isMoveSubmitted, setIsMoveSubmitted] = useState(false);

  const fetchPlayerDataAndEffects = async (battleId, playerAddress) => {
    const playerDatas = await battleContract.call("getCharacterProxy", [
      battleId,
      playerAddress,
    ]);
    const playerEffects = await battleContract.call(
      "getCharacterProxyActiveEffects",
      [battleId, playerAddress]
    );

    return {
      ...playerDatas,
      activeEffectIds: playerEffects[0],
      activeEffectDurations: playerEffects[1],
    };
  };

  const animateAndSetData = async (
    playerKey,
    playerDataWithEffects,
    ref,
    delay
  ) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const coords = getCoords(ref);
        if (coords) {
          sparcle(coords, () => {
            // Here we update the specific player's data in the state
            setPlayerData((prevState) => ({
              ...prevState,
              [playerKey]: playerDataWithEffects,
            }));
            resolve();
          });
        } else {
          resolve();
        }
      }, delay);
    });
  };

  const fetchSummary = async () => {
    const rawSummary = await battleContract.call("getBattle", [state.battleId]);
    console.log(rawSummary);

    // Create a new object with only the properties you need
    const summary = {
      players: rawSummary.players,
      round: rawSummary.round.toNumber(),
      damageDealt: rawSummary.battleStats[2].map((x) => x.toNumber()),
      damageTaken: rawSummary.battleStats[3].map((x) => x.toNumber()),
      damageReduced: rawSummary.battleStats[4].map((x) => x.toNumber()),
      healthRegenerated: rawSummary.battleStats[5].map((x) => x.toNumber()),
      manaRegenerated: rawSummary.battleStats[6].map((x) => x.toNumber()),
      expReceived: rawSummary.battleStats[7].map((x) => x.toNumber()),
      leaguePointsEarned: rawSummary.battleStats[8].map((x) => x.toNumber()),
      winner: rawSummary.winner,
      loser:
        rawSummary.players[0].toLowerCase() === rawSummary.winner.toLowerCase()
          ? rawSummary.players[1]
          : rawSummary.players[0],
    };

    if (walletAddress.toLowerCase() === summary.winner.toLowerCase()) {
      setShowAlert({ status: true, type: "success", message: "You won!" });
      console.log("You won!");
    } else if (walletAddress.toLowerCase() === summary.loser.toLowerCase()) {
      setShowAlert({ status: true, type: "failure", message: "You lost!" });
      console.log("You lost!");
    }

    // Add a delay of 1 second before setting the battle summary
    setTimeout(() => {
      setBattleSummary(summary);
      setIsModalOpen(true);
      setBattleIsOver(false);
    }, 1000);
  };

  const fetchPlayerData = async () => {
    if (gameData.activeBattle && battleContract) {
      let player01Address = null;
      let player02Address = null;
      if (
        gameData.activeBattle.players[0].toLowerCase() ===
        walletAddress.toLowerCase()
      ) {
        player01Address = gameData.activeBattle.players[0];
        player02Address = gameData.activeBattle.players[1];
      } else {
        player01Address = gameData.activeBattle.players[1];
        player02Address = gameData.activeBattle.players[0];
      }

      const [player1Data, player2Data] = await Promise.all([
        fetchPlayerDataAndEffects(
          gameData.activeBattle.battleId,
          player01Address
        ),
        fetchPlayerDataAndEffects(
          gameData.activeBattle.battleId,
          player02Address
        ),
      ]);

      const playerDataWithEffects = {
        player1Data: player1Data,
        player2Data: player2Data,
      };

      // Check if the player data has changed
      if (
        JSON.stringify(playerData.player1Data) !==
          JSON.stringify(playerDataWithEffects.player1Data) ||
        JSON.stringify(playerData.player2Data) !==
          JSON.stringify(playerDataWithEffects.player2Data)
      ) {
        // If the player data has changed, update the state
        setShouldPollPlayerData(false);

        // Clear the interval
        if (playerIntRef.current) {
          clearInterval(playerIntRef.current);
          playerIntRef.current = null;
        }

        if (
          damagedPlayers.length > 0 &&
          damagedPlayers.every((address) => address !== emptyAccount)
        ) {
          console.log("Damaged Players: ", damagedPlayers);

          let delay = 0;
          const delayIncrement = 1000;

          // Animate and update the player 1 data
          if (
            damagedPlayers.includes(gameData.activeBattle.players[0]) &&
            player1Data
          ) {
            await animateAndSetData(
              "player1Data",
              player1Data,
              player1Ref,
              delay
            );
            delay += delayIncrement;
          }

          // Animate and update the player 2 data
          if (
            damagedPlayers.includes(gameData.activeBattle.players[1]) &&
            player2Data
          ) {
            await animateAndSetData(
              "player2Data",
              player2Data,
              player2Ref,
              delay
            );
            delay += delayIncrement;
          }

          if (isMoveSubmitted) {
            setIsMoveSubmitted(false);
          }

          // console.log("Before setPlayerData", playerData);
          // setPlayerData(playerDataWithEffects);
          // console.log("After setPlayerData", playerData);

          setTimeout(() => {
            // Add delay before fetching the summary
            if (battleIsOver) {
              fetchSummary();
            }
          }, 1000);
        } else {
          // If there are no damagedPlayers, set the player data immediately
          console.log(damagedPlayers);
          setPlayerData(playerDataWithEffects);
          if (isMoveSubmitted) {
            setIsMoveSubmitted(false);
          }
          setTimeout(() => {
            // Add delay before fetching the summary
            if (battleIsOver) {
              fetchSummary();
            }
          }, 1000);
        }
      } else if (state.player1.mana === 0 || state.player2.mana === 0) {
        console.log("fetched", playerData);
        await fetchGameData();
        setPlayerData(playerDataWithEffects);
      }
    }
  };

  // Inside your component
  useEffect(() => {
    // Call fetchPlayerData once on mount or when shouldPollPlayerData or gameData changes
    fetchPlayerData();

    if (shouldPollPlayerData) {
      // Start polling
      playerIntRef.current = setInterval(fetchPlayerData, 5000);
    }

    return () => {
      // Stop polling
      if (playerIntRef.current) {
        clearInterval(playerIntRef.current);
        playerIntRef.current = null;
      }
    };
  }, [
    shouldPollPlayerData,
    gameData, // Add gameData as a dependency
    battleContract,
    gameData.activeBattle,
    walletAddress,
  ]);

  useEffect(() => {
    if (playerData.player1Data && playerData.player2Data) {
      if (
        !gameData.activeBattle ||
        !gameData.activeBattle.battleStats.initialHealth
      ) {
        return;
      }
      const player01 = playerData.player1Data;
      const player02 = playerData.player2Data;
      const typeId = player01.typeId.toNumber();
      const characterInfo = characters.filter(
        (item) => item.characterType === typeId
      )[0];

      const newState = {
        player1: {
          ...Player,
          att: player01.attack.toNumber(),
          def: player01.defense.toNumber(),
          health: player01.health.toNumber(),
          mana: player01.mana.toNumber(),
          equippedSkills: player01.equippedSkills,
          activeEffectIds: player01.activeEffectIds,
          activeEffectDurations: player01.activeEffectDurations,
        },
        player2: {
          ...Player,
          att: "X",
          def: "X",
          health: player02.health.toNumber(),
          mana: player02.mana.toNumber(),
          equippedSkills: player02.equippedSkills,
          activeEffectIds: player02.activeEffectIds,
          activeEffectDurations: player02.activeEffectDurations,
        },
        p1InitHP:
          gameData.activeBattle.battleStats.initialHealth[
            gameData.activeBattle.players[0].toLowerCase() ===
            walletAddress.toLowerCase()
              ? 0
              : 1
          ].toNumber(),
        p2InitHP:
          gameData.activeBattle.battleStats.initialHealth[
            gameData.activeBattle.players[0].toLowerCase() ===
            walletAddress.toLowerCase()
              ? 1
              : 0
          ].toNumber(),
        battleId: gameData.activeBattle.battleId,
        character: characterInfo || null,
      };
      setState(newState);
    }
  }, [playerData, gameData, walletAddress]);

  useEffect(() => {
    if (
      state.player1 &&
      state.player2 &&
      state.p1InitHP !== null &&
      state.p2InitHP !== null &&
      state.battleId !== null &&
      state.character
    ) {
      if (state.player1.mana === 0 || state.player2.mana === 0) {
        // If mana of either player is zero, start polling
        const intervalId = setInterval(() => {
          console.log("initial player fetch");
          fetchPlayerData();
        }, 5000); // Fetch data every 5 seconds

        // Clear interval when component is unmounted or player mana is not 0
        return () => clearInterval(intervalId);
      } else {
        // If mana of both players is not zero, stop loading
        setLoading(false);
      }
    }
  }, [state]);

  const makeAMove = async (choice, skillId) => {
    setIsMoveSubmitted(true);
    playAudio(
      choice === 0 ? attackSound : choice === 1 ? defenseSound : defenseSound
    );

    try {
      const moveTx = await battleContract.call("submitMove", [
        state.battleId,
        choice,
        skillId,
      ]);

      await moveTx.wait();
      // fetchPlayerData();
    } catch (error) {
      setIsMoveSubmitted(false);
      setErrorMessage(error);
    }
  };

  return (
    <div
      className={`${styles.flexBetween} ${styles.gameContainer} ${battleGround}`}
    >
      {loading ? (
        <Loader message="Initializing battle, please wait..." />
      ) : (
        <>
          {showAlert?.status && (
            <Alert type={showAlert.type} message={showAlert.message} />
          )}

          <PlayerInfo
            player={state.player2}
            playerIcon={player02Icon}
            mt
            health={state.p2InitHP}
          />

          <div className={`${styles.flexCenter} flex-col my-10`}>
            <div className="relative">
              <div ref={player2Ref}>
                <Card
                  card={state.player2}
                  title={state.player2?.id}
                  playerTwo
                />
              </div>
              <StatusEffect
                activeEffectIds={state.player2.activeEffectIds}
                activeEffectDurations={state.player2.activeEffectDurations}
                className="absolute bottom-0 right-0"
              />
            </div>

            {state.player1.equippedSkills &&
              state.player1.equippedSkills.length > 0 && (
                <div className="flex items-center flex-row">
                  {state.player1.equippedSkills.map((skillId, index) => {
                    const skill = skills.find(
                      (s) => s.id === skillId.toNumber()
                    );

                    return (
                      <ActionButton
                        key={index}
                        imgUrl={skill.image}
                        handleClick={() => makeAMove(2, skillId)}
                        restStyles="ml-6 mt-6 hover:border-red-600"
                        disabled={isMoveSubmitted}
                      />
                    );
                  })}
                </div>
              )}

            <div className="flex items-center flex-row">
              <ActionButton
                imgUrl={attack}
                handleClick={() => {
                  makeAMove(0, 999999);
                }}
                restStyles="mr-2 hover:border-yellow-400"
                disabled={isMoveSubmitted}
              />

              <div className="relative">
                <div ref={player1Ref}>
                  <Card
                    card={state.player1}
                    title={state.player1.id}
                    restStyles="mt-3"
                  />
                </div>
                <StatusEffect
                  activeEffectIds={state.player1.activeEffectIds}
                  activeEffectDurations={state.player1.activeEffectDurations}
                  className="absolute bottom-0 left-0"
                />
              </div>

              <ActionButton
                imgUrl={defense}
                handleClick={() => makeAMove(1, 999999)}
                restStyles="ml-6 hover:border-red-600"
                disabled={isMoveSubmitted}
              />
            </div>
          </div>

          <PlayerInfo
            player={state.player1}
            playerIcon={player01Icon}
            health={state.p1InitHP}
          />

          <GameInfo id={state.battleId} />
        </>
      )}
      <BattleSummaryModal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        battleSummary={battleSummary}
      />
    </div>
  );
};

export default React.memo(Battle);

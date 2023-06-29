/* eslint-disable prefer-destructuring */
import React, { useEffect, useState, useRef } from "react";
import { useContract } from "@thirdweb-dev/react";
import { useNavigate } from "react-router-dom";

import { battleContractAddress } from "../contract";
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

const Battle = () => {
  const {
    battleContract,
    gameData,
    battleGround,
    walletAddress,
    setErrorMessage,
    showAlert,
    setShowAlert,
    playerData,
    fetchPlayerData,
    battleIsOver,
    setBattleIsOver,
    damagedPlayers,
  } = useGlobalContext();

  const player1Ref = useRef();
  const player2Ref = useRef();

  const [state, setState] = useState({
    player1: {},
    player2: {},
    playersLoaded: false,
    character: null,
    p1InitHP: null,
    p2InitHP: null,
    battleId: null,
  });

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [battleSummary, setBattleSummary] = useState(null);

  const { contract: battleTWContract } = useContract(battleContractAddress);

  useEffect(() => {
    if (battleIsOver) {
      // replace with actual condition
      // Fetch battle summary from blockchain
      const fetchSummary = async () => {
        const summary = await battleTWContract.call("getBattleSummary", [
          state.battleId,
        ]);
        setBattleSummary(summary);
        setIsModalOpen(true);
        setBattleIsOver(false);
      };

      fetchSummary();
    }
  }, [battleIsOver]);

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
          att: player01.attack.toNumber(),
          def: player01.defense.toNumber(),
          health: player01.health.toNumber(),
          mana: player01.mana.toNumber(),
          equippedSkills: player01.equippedSkills,
          activeEffectIds: player01.activeEffectIds,
          activeEffectDurations: player01.activeEffectDurations,
        },
        player2: {
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
      setLoading(false);
    }
  }, [state]);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     if (!gameData?.activeBattle) {
  //       console.log("No active battle found");
  //       navigate("/create-battle");
  //     }
  //   }, [20000]);

  //   return () => clearTimeout(timer);
  // }, [battleContract, gameData, gameData.activeBattle]);

  //* Get battle card coordinates
  const getCoords = (cardRef) => {
    const { left, top, width, height } =
      cardRef.current.getBoundingClientRect();

    return {
      pageX: left + width / 2,
      pageY: top + height / 2.25,
    };
  };

  useEffect(() => {
    damagedPlayers.forEach((player, i) => {
      if (player !== emptyAccount) {
        if (player.toLowerCase() === walletAddress.toLowerCase()) {
          sparcle(getCoords(player1Ref));
        } else if (player.toLowerCase() !== walletAddress.toLowerCase()) {
          sparcle(getCoords(player2Ref));
        }
      } else {
        playAudio(defenseSound);
      }
    });
  }, [damagedPlayers]);

  const makeAMove = async (choice, skillId) => {
    playAudio(choice === 0 ? attackSound : choice === 1 ? defenseSound : null);

    try {
      const moveTx = await battleContract.submitMove(
        state.battleId,
        choice,
        skillId
      );

      await moveTx.wait();
      fetchPlayerData();

      setShowAlert({
        status: true,
        type: "info",
        message: `Initiating ${
          choice === 0 ? "attack" : choice === 1 ? "defense" : "skill"
        }`,
      });
    } catch (error) {
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
                      />
                    );
                  })}
                </div>
              )}

            <div className="flex items-center flex-row">
              <ActionButton
                imgUrl={attack}
                handleClick={() => makeAMove(0, 999999)}
                restStyles="mr-2 hover:border-yellow-400"
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
              />
            </div>
          </div>

          <PlayerInfo
            player={state.player1}
            playerIcon={player01Icon}
            health={state.p1InitHP}
          />

          <GameInfo id={state.battleId} />
          {/* <BattleLog battleId={state.battleId.toNumber()} /> */}
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

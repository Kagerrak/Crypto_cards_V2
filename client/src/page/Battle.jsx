/* eslint-disable prefer-destructuring */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "../styles";
import {
  ActionButton,
  Alert,
  Card,
  GameInfo,
  PlayerInfo,
  Loader,
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
import { playAudio } from "../utils/animation.js";

const Battle = () => {
  const {
    battleContract,
    gameData,
    battleGround,
    walletAddress,
    setErrorMessage,
    showAlert,
    setShowAlert,
    player1Ref,
    player2Ref,
    playerData,
  } = useGlobalContext();

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

  useEffect(() => {
    console.log("First useEffect called");
    if (playerData.player1Data && playerData.player2Data) {
      if (!gameData.activeBattle || !gameData.activeBattle.initialHealth) {
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
        },
        player2: {
          att: "X",
          def: "X",
          health: player02.health.toNumber(),
          mana: player02.mana.toNumber(),
        },
        p1InitHP:
          gameData.activeBattle.initialHealth[
            gameData.activeBattle.players[0].toLowerCase() ===
            walletAddress.toLowerCase()
              ? 0
              : 1
          ].toNumber(),
        p2InitHP:
          gameData.activeBattle.initialHealth[
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!gameData?.activeBattle) navigate("/create-battle");
    }, [3000]);

    return () => clearTimeout(timer);
  }, [battleContract, gameData, gameData.activeBattle]);

  const makeAMove = async (choice) => {
    playAudio(choice === 0 ? attackSound : choice === 1 ? defenseSound : null);

    try {
      await battleContract.submitMove(state.battleId, choice, {
        gasLimit: 200000,
      });

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
            <Card
              card={state.player2}
              title={state.player2?.id}
              cardRef={player2Ref}
              playerTwo
            />

            {state.character && (
              <div className="flex items-center flex-row">
                <ActionButton
                  imgUrl={state.character.icon}
                  handleClick={() => makeAMove(2)}
                  restStyles="ml-6 mt-6 hover:border-red-600"
                />
              </div>
            )}

            <div className="flex items-center flex-row">
              <ActionButton
                imgUrl={attack}
                handleClick={() => makeAMove(0)}
                restStyles="mr-2 hover:border-yellow-400"
              />

              <Card
                card={state.player1}
                title={state.player1.id}
                cardRef={player1Ref}
                restStyles="mt-3"
              />

              <ActionButton
                imgUrl={defense}
                handleClick={() => makeAMove(1)}
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
        </>
      )}
    </div>
  );
};

export default React.memo(Battle);

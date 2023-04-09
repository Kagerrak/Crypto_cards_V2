/* eslint-disable prefer-destructuring */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import styles from "../styles";
import { ActionButton, Alert, Card, GameInfo, PlayerInfo } from "../components";
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
  } = useGlobalContext();

  const [player2, setPlayer2] = useState({});
  const [player1, setPlayer1] = useState({});
  const [playersLoaded, setPlayersLoaded] = useState(false);
  const [character, setCharacter] = useState();
  const { battleName } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const getPlayerInfo = async () => {
      try {
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

        const battleId = gameData.activeBattle.battleId;

        const [player01, player02] = await Promise.all([
          battleContract.getCharacterProxy(battleId, player01Address),
          battleContract.getCharacterProxy(battleId, player02Address),
        ]);

        console.log(player01);

        const p1Att = player01.attack.toNumber();
        console.log(p1Att);
        const p1Def = player01.defense.toNumber();

        const typeId = player01.id.toNumber();

        const characterInfo = characters.filter(
          (item) => item.characterType === typeId
        )[0];

        setCharacter(characterInfo);

        const p1H = player01.health.toNumber();
        const p1M = player01.mana.toNumber();
        const p2H = player02.health.toNumber();
        const p2M = player02.mana.toNumber();

        setPlayer1({
          att: p1Att,
          def: p1Def,
          health: p1H,
          mana: p1M,
        });
        setPlayer2({
          att: "X",
          def: "X",
          health: p2H,
          mana: p2M,
        });
        setPlayersLoaded(true);
      } catch (error) {
        setErrorMessage(error.message);
      }
    };

    if (battleContract && gameData.activeBattle) {
      getPlayerInfo();
    }
  }, [battleContract, gameData.activeBattle, walletAddress]);

  console.log(player1.att);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!gameData?.activeBattle) navigate("/");
    }, [2000]);

    return () => clearTimeout(timer);
  }, [battleContract]);

  const makeAMove = async (choice) => {
    playAudio(choice === 1 ? attackSound : choice === 2 ? defenseSound : null);

    try {
      await battleContract.submitMove(choice, battleName, {
        gasLimit: 200000,
      });

      setShowAlert({
        status: true,
        type: "info",
        message: `Initiating ${
          choice === 1 ? "attack" : choice === 2 ? "defense" : "skill"
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
      {showAlert?.status && (
        <Alert type={showAlert.type} message={showAlert.message} />
      )}

      {playersLoaded && (
        <>
          <PlayerInfo player={player2} playerIcon={player02Icon} mt />

          <div className={`${styles.flexCenter} flex-col my-10`}>
            <Card
              card={player2}
              title={player2?.id}
              cardRef={player2Ref}
              playerTwo
            />

            {character ? (
              <div className="flex items-center flex-row">
                <ActionButton
                  imgUrl={character?.battle_icon}
                  handleClick={() => makeAMove(3)}
                  restStyles="ml-6 mt-6 hover:border-red-600"
                />
              </div>
            ) : (
              <></>
            )}

            <div className="flex items-center flex-row">
              <ActionButton
                imgUrl={attack}
                handleClick={() => makeAMove(1)}
                restStyles="mr-2 hover:border-yellow-400"
              />

              <Card
                card={player1}
                title={player1.id}
                cardRef={player1Ref}
                restStyles="mt-3"
              />

              <ActionButton
                imgUrl={defense}
                handleClick={() => makeAMove(2)}
                restStyles="ml-6 hover:border-red-600"
              />
            </div>
          </div>

          <PlayerInfo player={player1} playerIcon={player01Icon} />
        </>
      )}

      <GameInfo />
    </div>
  );
};

export default Battle;

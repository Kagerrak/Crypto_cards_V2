/* eslint-disable prefer-destructuring */
import React, { useEffect, useState, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";

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
  const [p1InitHP, setP1InitHP] = useState(null);
  const [p2InitHP, setP2InitHP] = useState(null);
  const [battleId, setBattleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const getPlayerInfo = async () => {
      try {
        setLoading(true);
        let player01Address = null;
        let player02Address = null;

        if (
          gameData.activeBattle.players[0].toLowerCase() ===
          walletAddress.toLowerCase()
        ) {
          player01Address = gameData.activeBattle.players[0];
          player02Address = gameData.activeBattle.players[1];
          setP1InitHP(gameData.activeBattle.initialHealth[0].toNumber());
          setP2InitHP(gameData.activeBattle.initialHealth[1].toNumber());
          setBattleId(gameData.activeBattle.battleId);
        } else {
          player01Address = gameData.activeBattle.players[1];
          player02Address = gameData.activeBattle.players[0];
          setP1InitHP(gameData.activeBattle.initialHealth[1].toNumber());
          setP2InitHP(gameData.activeBattle.initialHealth[0].toNumber());
          setBattleId(gameData.activeBattle.battleId);
        }

        console.log(p1InitHP, p2InitHP);

        const [player01, player02] = await Promise.all([
          battleContract.getCharacterProxy(battleId, player01Address),
          battleContract.getCharacterProxy(battleId, player02Address),
        ]);

        console.log(player01);

        const p1Att = player01.attack.toNumber();
        console.log(p1Att);
        const p1Def = player01.defense.toNumber();

        const typeId = player01.id.toNumber();
        console.log(typeId);

        const characterInfo = characters.filter(
          (item) => item.characterType === typeId
        )[0];
        console.log(characterInfo);

        if (characterInfo) {
          setCharacter(characterInfo);
        } else {
          setCharacter(null);
        }

        const p1H = player01.health.toNumber();
        console.log(p1H);
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
      } finally {
        setLoading(false);
      }
    };

    if (battleContract && gameData.activeBattle && !playersLoaded && !fetched) {
      getPlayerInfo();
    } else {
      setLoading(false);
    }
  }, [
    battleContract,
    gameData.activeBattle,
    walletAddress,
    character,
    playersLoaded,
    fetched,
  ]);

  console.log(player1.att);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!gameData?.activeBattle) navigate("/");
    }, [2000]);

    return () => clearTimeout(timer);
  }, [battleContract]);

  useEffect(() => {
    if (playersLoaded) {
      setFetched(true);
      setLoading(false);
    }
  }, [playersLoaded]);

  const makeAMove = async (choice) => {
    playAudio(choice === 0 ? attackSound : choice === 1 ? defenseSound : null);

    try {
      await battleContract.submitMove(battleId, choice, {
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className={`${styles.flexBetween} ${styles.gameContainer} ${battleGround}`}
    >
      {showAlert?.status && (
        <Alert type={showAlert.type} message={showAlert.message} />
      )}

      {fetched && (
        <>
          <PlayerInfo
            player={player2}
            playerIcon={player02Icon}
            mt
            health={p2InitHP}
          />

          <div className={`${styles.flexCenter} flex-col my-10`}>
            <Card
              card={player2}
              title={player2?.id}
              cardRef={player2Ref}
              playerTwo
            />

            {character && (
              <div className="flex items-center flex-row">
                <ActionButton
                  imgUrl={character.icon}
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
                card={player1}
                title={player1.id}
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
            player={player1}
            playerIcon={player01Icon}
            health={p1InitHP}
          />
        </>
      )}

      <GameInfo id={battleId} />
    </div>
  );
};

export default Battle;

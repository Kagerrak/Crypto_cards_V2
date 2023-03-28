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
    contract,
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
  const [player2Character, setPlayer2Character] = useState({});
  const [player1Character, setPlayer1Character] = useState({});
  const [player1, setPlayer1] = useState({});
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

        const p1TokenData = await contract.getPlayerToken(player01Address);
        const p2TokenData = await contract.getPlayerToken(player02Address);
        const player01 = await contract.getPlayer(player01Address);
        const player02 = await contract.getPlayer(player02Address);

        const p1Att = p1TokenData.attackStrength.toNumber();
        const p1Def = p1TokenData.defenseStrength.toNumber();

        const tokenId = p1TokenData.id.toNumber();

        const p1Character = await contract.gameCharacters(
          p1TokenData.id.toNumber() - 1
        );

        const p2Character = await contract.gameCharacters(
          p2TokenData.id.toNumber() - 1
        );

        setPlayer1Character({
          ...player1Character,
          health: p1Character.health,
          mana: p1Character.mana,
        });
        setPlayer2Character({
          ...player2Character,
          health: p2Character.health,
          mana: p2Character.mana,
        });

        const characterInfo = characters.filter((item) => {
          return item.tokenId === tokenId;
        })[0];

        setCharacter(characterInfo);

        console.log("hello", { ...characterInfo });

        const p1H = player01.playerHealth.toNumber();
        const p1M = player01.playerMana.toNumber();
        const p2H = player02.playerHealth.toNumber();
        const p2M = player02.playerMana.toNumber();

        //console.log("p1H",p1H,p1Character.health.toNumber(),p2H,p2Character.health.toNumber());

        setPlayer1({
          ...player01,
          att: p1Att,
          def: p1Def,
          health: p1H,
          mana: p1M,
        });
        setPlayer2({ ...player02, att: "X", def: "X", health: p2H, mana: p2M });
      } catch (error) {
        setErrorMessage(error.message);
      }
    };

    if (contract && gameData.activeBattle) getPlayerInfo();
  }, [contract, gameData, battleName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!gameData?.activeBattle) navigate("/");
    }, [2000]);

    return () => clearTimeout(timer);
  }, [contract]);

  const makeAMove = async (choice) => {
    playAudio(choice === 1 ? attackSound : defenseSound);

    try {
      await contract.attackOrDefendChoice(choice, battleName, {
        gasLimit: 200000,
      });

      setShowAlert({
        status: true,
        type: "info",
        message: `Initiating ${choice === 1 ? "attack" : "defense"}`,
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

      <PlayerInfo
        player={player2}
        playerIcon={player02Icon}
        character={player2Character}
        mt
      />

      <div className={`${styles.flexCenter} flex-col my-10`}>
        <Card
          card={player2}
          title={player2?.playerName}
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
            title={player1?.playerName}
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

      <PlayerInfo
        player={player1}
        playerIcon={player01Icon}
        character={player1Character}
      />

      <GameInfo />
    </div>
  );
};

export default Battle;

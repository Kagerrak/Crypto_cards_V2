import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "../styles";
import { CustomButton, PageHOC, Loader } from "../components";
import { useGlobalContext } from "../context";

const Colosseum = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const {
    contract,
    gameData,
    setShowAlert,
    setBattleName,
    setErrorMessage,
    address,
  } = useGlobalContext();

  useEffect(() => {
    if (!address) navigate("/");

    const checkPlayer = async () => {
      const playerExists = await contract?.isPlayer(address);
      if (!playerExists) {
        navigate("/");
      }
    };

    checkPlayer();

    if (gameData?.activeBattle?.battleStatus === 1)
      navigate(`/battle/${gameData.activeBattle.name}`);
  }, [gameData]);

  const handleClick = async (battleName) => {
    setBattleName(battleName);

    try {
      setIsLoading(true);
      const fees = await contract.battleFee();
      const tx = await contract.joinBattle(battleName, {
        gasLimit: 500000,
        value: fees,
      });
      tx.wait();
      setIsLoading(false);
      setShowAlert({
        status: true,
        type: "success",
        message: `Joining ${battleName}`,
      });
    } catch (error) {
      setErrorMessage(error);
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <Loader />}
      <h2 className={styles.joinHeadText}>Available Battles:</h2>

      <div className={styles.joinContainer}>
        {gameData.pendingBattles.length ? (
          gameData.pendingBattles
            .filter(
              (battle) =>
                !battle.players.join().toLowerCase().includes(address) &&
                battle.battleStatus !== 1
            )
            .map((battle, index) => (
              <div key={battle.name + index} className={styles.flexBetween}>
                <p className={styles.joinBattleTitle}>
                  {index + 1}. {battle.name}{" "}
                </p>
                <CustomButton
                  title="Join"
                  handleClick={() => handleClick(battle.name)}
                />
              </div>
            ))
        ) : (
          <p className={styles.joinLoading}>
            Reload the page to see new battles
          </p>
        )}
      </div>

      {address && (
        <p
          className={styles.infoText}
          onClick={() => navigate("/create-battle")}
        >
          Or create a new battle
        </p>
      )}
    </>
  );
};

export default PageHOC(
  Colosseum,
  <>
    Challenge <br /> another to Battle
  </>,
  <>Join an already existing battle from below</>
);

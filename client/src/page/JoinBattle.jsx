import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useGlobalContext } from "../context";
import { CustomButton, PageHOC, Loader } from "../components";
import styles from "../styles";

const JoinBattle = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const {
    contract,
    gameData,
    setShowAlert,
    setBattleName,
    setErrorMessage,
    walletAddress,
  } = useGlobalContext();

  useEffect(() => {
    if (gameData?.activeBattle?.battleStatus === 1) {
      navigate(`/battle/${gameData.activeBattle.name}`);
    }
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
      await tx.wait();
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
                !battle.players.join().toLowerCase().includes(walletAddress) &&
                battle.battleStatus !== 1
            )
            .map((battle, index) => (
              <div key={battle.name + index} className={styles.flexBetween}>
                <p className={styles.joinBattleTitle}>
                  {index + 1}. {battle.name}
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

      <p className={styles.infoText} onClick={() => navigate("/create-battle")}>
        Or create a new battle
      </p>
    </>
  );
};

export default PageHOC(
  JoinBattle,
  <>
    Challenge <br /> another to Battle
  </>,
  <>Join an already existing battle from below</>
);

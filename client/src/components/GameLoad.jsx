import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import CustomButton from "./CustomButton";
import { useGlobalContext } from "../context";
import Loader from "./Loader";
import { player01, player02 } from "../assets";
import styles from "../styles";

const GameLoad = () => {
  const { walletAddress, battleContract, gameData, setErrorMessage } =
    useGlobalContext();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const refresh = () => window.location.reload(true);

  const handleCancel = async () => {
    try {
      setIsLoading(true);
      const { battleId } = gameData.activeBattle;
      console.log(battleId);
      const tx = await battleContract.cancelBattle(battleId);
      await tx.wait(1);
      setIsLoading(false);
      navigate("/create-battle");
      refresh();
    } catch (error) {
      setErrorMessage(error);
      setIsLoading(false);
      console.error(error);
    }
  };

  return (
    <>
      {isLoading && (
        <Loader message="Cancelling Battle. Confirm transaction." />
      )}
      <div className={`${styles.flexBetween} ${styles.gameLoadContainer}`}>
        <div className={styles.gameLoadBtnBox}>
          <CustomButton
            title="Choose Battleground"
            handleClick={() => navigate("/battleground")}
            restStyles="mt-6"
          />
        </div>

        <div className={`flex-1 ${styles.flexCenter} flex-col pb-20`}>
          <h1 className={`${styles.headText} text-center`}>
            Waiting for a <br /> worthy opponent...
          </h1>
          <p className={styles.gameLoadText}>
            Protip: while you're waiting, choose your preferred battleground
          </p>

          <div className={styles.gameLoadPlayersBox}>
            <div className={`${styles.flexCenter} flex-col`}>
              <img src={player01} className={styles.gameLoadPlayerImg} />
              <p className={styles.gameLoadPlayerText}>
                {walletAddress.slice(0, 30)}
              </p>
            </div>

            <h2 className={styles.gameLoadVS}>Vs</h2>

            <div className={`${styles.flexCenter} flex-col`}>
              <img src={player02} className={styles.gameLoadPlayerImg} />
              <p className={styles.gameLoadPlayerText}>??????????</p>
            </div>
          </div>

          <div className="mt-10">
            <p className={`${styles.infoText} text-center mb-5`}>OR</p>

            <CustomButton
              title="Cancel Battle"
              handleClick={handleCancel}
              restStyles="mx-6"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default GameLoad;

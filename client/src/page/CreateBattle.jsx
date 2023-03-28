import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";

import styles from "../styles";
import { useGlobalContext } from "../context";
import {
  CustomButton,
  CustomInput,
  GameLoad,
  PageHOC,
  Loader,
} from "../components";

const CreateBattle = () => {
  const { contract, gameData, setBattleName, setErrorMessage, walletAddress } =
    useGlobalContext();
  const [waitBattle, setWaitBattle] = useState(false);
  const [battleTempName, setBattleTempName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const refresh = () => window.location.reload(true);

  useEffect(() => {
    if (!walletAddress) navigate("/");

    const checkPlayer = async () => {
      const playerExists = await contract?.isPlayer(walletAddress);
      if (!playerExists) {
        navigate("/");
      }
    };

    checkPlayer();

    console.log(
      "gameData?.activeBattle?",
      gameData?.activeBattle?.battleStatus
    );

    if (gameData?.activeBattle?.battleStatus === 0) {
      setWaitBattle(true);
    } else if (gameData?.activeBattle?.battleStatus === 1) {
      // setWaitBattle(true);
      navigate(`/battle/${gameData.activeBattle.name}`);
    }
  }, [gameData, walletAddress]);

  const handleClick = async () => {
    if (battleTempName === "" || battleTempName.trim() === "") return null;

    try {
      setIsLoading(true);
      const credit = await contract.playerCredit(walletAddress);
      console.log(ethers.utils.formatEther(credit));
      if (ethers.utils.formatEther(credit) > 0) {
        const tx = await contract.createBattle(battleTempName);
        await tx.wait(1);
      } else {
        const fees = await contract.battleFee();
        const tx = await contract.createBattle(battleTempName, {
          gasLimit: 500000,
          value: fees,
        });
        await tx.wait(1);
      }

      setBattleName(battleTempName);
      setIsLoading(false);
      setWaitBattle(true);
      refresh();
    } catch (error) {
      setErrorMessage(error);
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading ? <Loader /> : waitBattle && <GameLoad />}

      <div className="flex flex-col mb-5">
        <CustomInput
          label="Battle"
          placeHolder="Enter battle name"
          value={battleTempName}
          handleValueChange={setBattleTempName}
        />

        <CustomButton
          title="Create Battle"
          handleClick={handleClick}
          restStyles="mt-6"
        />
      </div>
      <p className={styles.infoText} onClick={() => navigate("/join-battle")}>
        Or challenge another to join an already existing battle
      </p>
    </>
  );
};

export default PageHOC(
  CreateBattle,
  <>
    Join <br /> the Champions League
  </>,
  <>Create your own battle and wait for other players to challenge you</>
);

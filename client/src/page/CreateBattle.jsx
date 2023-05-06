import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useOwnedNFTs,
  useContract,
  useContractRead,
} from "@thirdweb-dev/react";

import { characterContractAddress } from "../contract";
import styles from "../styles";
import { useGlobalContext } from "../context";
import {
  CustomButton,
  CustomInput,
  GameLoad,
  PageHOC,
  Loader,
  NftItem,
} from "../components";

const CreateBattle = () => {
  const {
    characterContract,
    battleContract,
    gameData,
    setBattleName,
    setErrorMessage,
    walletAddress,
  } = useGlobalContext();
  const [waitBattle, setWaitBattle] = useState(false);
  const [battleTempName, setBattleTempName] = useState("");
  const [selectedTokenID, setSelectedTokenID] = useState(null); // new state variable
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { contract: charContract, isLoading: charLoad } = useContract(
    characterContractAddress
  );

  const { data: ownedNfts } = useOwnedNFTs(charContract, walletAddress);

  useEffect(() => {
    if (!walletAddress) navigate("/");

    const checkPlayer = async () => {
      const hasCharacter = await characterContract.balanceOf(walletAddress);
      if (!hasCharacter) {
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
      navigate(`/battle/${gameData.activeBattle.name}`);
    }
  }, [gameData, walletAddress]);

  useEffect(() => {
    if (Array.isArray(ownedNfts) && ownedNfts.length === 1) {
      setSelectedTokenID(ownedNfts[0].metadata.id);
    }
  }, [ownedNfts]);

  let content;
  if (charLoad) {
    content = <Loader message="Loading Characters..." />;
  } else if (Array.isArray(ownedNfts) && ownedNfts.length > 0) {
    console.log(ownedNfts);
    content = ownedNfts.map((nft) => (
      <NftItem
        key={nft.metadata.id}
        metadata={nft.metadata}
        isSelected={
          ownedNfts.length === 1 || selectedTokenID === nft.metadata.id
        }
        onSelect={(id) => setSelectedTokenID(id)}
        contract={charContract}
      />
    ));
  } else {
    content = (
      <div className="text-center">
        <p>You don't have a character!</p>
        <p>Create one and join the battle!</p>
      </div>
    );
  }

  const handleClick = async () => {
    if (battleTempName === "" || battleTempName.trim() === "") return null;

    try {
      setIsLoading(true);

      const tx = await battleContract.createBattle(
        battleTempName,
        selectedTokenID
      );
      await tx.wait(1);

      setBattleName(battleTempName);
      setIsLoading(false);
      setWaitBattle(true);
    } catch (error) {
      setErrorMessage(error);
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading ? (
        <Loader message="Creating Battle..." />
      ) : (
        waitBattle && <GameLoad />
      )}

      <div className="flex flex-col mb-5">
        <CustomInput
          label="Battle"
          placeHolder="Enter battle name"
          value={battleTempName}
          handleValueChange={setBattleTempName}
        />

        <p className="mt-7 text-gray-500">Select a Character</p>
        <div className="flex flex-row mt-2 space-x-4">{content}</div>

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

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOwnedNFTs } from "@thirdweb-dev/react";

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
    address,
    fetchGameData,
    setBattleIsOver,
  } = useGlobalContext();
  const [waitBattle, setWaitBattle] = useState(false);
  const [battleTempName, setBattleTempName] = useState("");
  const [selectedTokenID, setSelectedTokenID] = useState(null); // new state variable
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // const { loading, error, data } = useQuery(GET_BATTLES);

  // useEffect(() => {
  //   if (!loading && !error) {
  //     console.log(data);
  //   }
  // }, [data]);

  const { data: ownedNfts, isLoading: charLoad } = useOwnedNFTs(
    characterContract,
    address
  );

  useEffect(() => {
    if (!address || !characterContract) navigate("/");

    const checkPlayer = async () => {
      const hasCharacter = await characterContract.call("balanceOf", [address]);
      if (!hasCharacter) {
        navigate("/");
      }
    };

    if (characterContract) {
      checkPlayer();
    }

    console.log(
      "gameData?.activeBattle?",
      gameData?.activeBattle?.battleStatus
    );

    if (gameData?.activeBattle?.battleStatus === 0) {
      setWaitBattle(true);
    } else if (gameData?.activeBattle?.battleStatus === 1) {
      navigate(`/battle/${gameData.activeBattle.name}`);
    }
  }, [gameData, address, characterContract]);

  useEffect(() => {
    if (Array.isArray(ownedNfts) && ownedNfts.length === 1) {
      setSelectedTokenID(ownedNfts[0].metadata.id);
    }
  }, [ownedNfts]);

  useEffect(() => {
    if (gameData) {
      if (gameData.activeBattle && gameData.activeBattle.battleStatus === 1) {
        console.log(
          "Navigating to battle from Home:",
          gameData.activeBattle.name
        );
        console.log("navigatinf to battle from useEffect CreateBattle");
        navigate(`/battle/${gameData.activeBattle.name}`);
      }
    }
  }, [gameData, navigate, battleContract]);

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
      />
    ));
  } else {
    content = (
      <div className="text-center text-gray-300">
        <p>You don't have a character!</p>
        <p>Create one and join the battle!</p>
      </div>
    );
  }

  const handleClick = async () => {
    if (battleTempName === "" || battleTempName.trim() === "") return null;

    try {
      setIsLoading(true);

      const tx = await battleContract.call("createBattle", [
        battleTempName,
        selectedTokenID,
      ]);
      await tx.wait(1);

      setBattleName(battleTempName);
      setBattleIsOver(false);
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
      <p
        className={styles.infoText}
        onClick={() => {
          fetchGameData();
          navigate("/join-battle");
        }}
      >
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

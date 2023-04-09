import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useOwnedNFTs,
  useContract,
  ThirdwebNftMedia,
} from "@thirdweb-dev/react";

import { characterContractAddress } from "../contract";
import { useGlobalContext } from "../context";
import { CustomButton, PageHOC, Loader } from "../components";
import styles from "../styles";

const JoinBattle = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTokenID, setSelectedTokenID] = useState(null);
  const navigate = useNavigate();
  const {
    battleContract,
    gameData,
    setShowAlert,
    setBattleName,
    setErrorMessage,
    walletAddress,
  } = useGlobalContext();

  const { contract: charContract, isLoading: charLoad } = useContract(
    characterContractAddress
  );

  const { data: ownedNfts } = useOwnedNFTs(charContract, walletAddress);

  useEffect(() => {
    if (gameData?.activeBattle?.battleStatus === 1) {
      navigate(`/battle/${gameData.activeBattle.name}`);
    }
  }, [gameData]);

  const handleClick = async (battleName, battleId, characterId) => {
    setBattleName(battleName);
    console.log(battleId.toNumber(), characterId);

    try {
      setIsLoading(true);
      const tx = await battleContract.joinBattle(
        battleId.toNumber(),
        characterId
      );
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

  let content;
  if (charLoad) {
    content = <Loader />;
  } else if (Array.isArray(ownedNfts) && ownedNfts.length > 0) {
    console.log(ownedNfts);
    content = ownedNfts.map((c) => (
      <div
        key={c.metadata.id}
        className={`${styles.nftContainer} hover:${
          styles.nftOverlayHover
        } focus:${styles.nftOverlayHover} ${
          selectedTokenID === c.metadata.id ? styles.nftSelected : ""
        }`}
        onClick={() => setSelectedTokenID(c.metadata.id)}
      >
        {console.log(selectedTokenID)}
        <div className={styles.nftOverlay} />
        <ThirdwebNftMedia metadata={c.metadata} height={200} />
      </div>
    ));
  } else {
    content = (
      <div className="text-center">
        <p>You don't have a character!</p>
        <p>Create one and join the battle!</p>
      </div>
    );
  }

  return (
    <>
      {isLoading && <Loader />}
      <h2 className={styles.joinHeadText}>Available Battles:</h2>

      {content}

      <div className={styles.joinContainer}>
        {gameData.pendingBattles.length ? (
          gameData.pendingBattles
            .filter(
              (battle) =>
                !battle.players.join().toLowerCase().includes(walletAddress) &&
                battle.battleStatus !== 1
            )
            .map((battle, index) => (
              <div key={battle.battleId + index} className={styles.flexBetween}>
                <p className={styles.joinBattleTitle}>
                  {index + 1}. {battle.name} {battle.battleId.toNumber()}
                </p>
                <CustomButton
                  title="Join"
                  handleClick={() =>
                    handleClick(battle.name, battle.battleId, selectedTokenID)
                  }
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

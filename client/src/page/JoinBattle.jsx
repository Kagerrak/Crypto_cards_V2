import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOwnedNFTs, useContract } from "@thirdweb-dev/react";

import { characterContractAddress } from "../contract";
import { useGlobalContext } from "../context";
import { CustomButton, PageHOC, Loader, NftItem } from "../components";
import styles from "../styles";

const JoinBattle = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTokenID, setSelectedTokenID] = useState(null);
  const [loadingGameData, setLoadingGameData] = useState(true);
  const navigate = useNavigate();
  const {
    battleContract,
    gameData,
    setShowAlert,
    setBattleName,
    setErrorMessage,
    address,
    fetchGameData,
  } = useGlobalContext();

  const { contract: charContract, isLoading: charLoad } = useContract(
    characterContractAddress
  );

  const { data: ownedNfts } = useOwnedNFTs(charContract, address);

  useEffect(() => {
    if (gameData) {
      setLoadingGameData(false);
      if (gameData.activeBattle && gameData.activeBattle.battleStatus === 1) {
        console.log(
          "Navigating to battle from JoinBattle:",
          gameData.activeBattle.name
        );
        navigate(`/battle/${gameData.activeBattle.name}`);
      }
    }
  }, [gameData, address, battleContract]);

  useEffect(() => {
    if (Array.isArray(ownedNfts) && ownedNfts.length === 1) {
      setSelectedTokenID(ownedNfts[0].metadata.id);
    }
  }, [ownedNfts]);

  const handleClick = async (battleName, battleId, characterId) => {
    setBattleName(battleName);
    console.log(battleId.toNumber(), characterId);

    try {
      setIsLoading(true);
      console.log("Joining battle...");
      console.log(battleContract);
      await battleContract.call("joinBattle", [
        battleId.toNumber(),
        characterId,
      ]);
      console.log("Updating game data...");
      await fetchGameData();

      setIsLoading(false);
      console.log(`navigating to ${battleName}`);
      navigate(`/battle/${battleName}`);
      setShowAlert({
        status: true,
        type: "success",
        message: `Joining ${battleName}`,
      });
      console.log("done");
    } catch (error) {
      setErrorMessage(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (gameData.activeBattle) {
      console.log("Active battle found, navigating to Battle page");
      navigate(`/battle/${gameData.activeBattle.name}`);
    }
  }, [gameData.activeBattle, navigate]);

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
    console.log(selectedTokenID); // null
  } else {
    content = (
      <div className="text-center">
        <p>You don't have a character!</p>
        <p>Create one and join the battle!</p>
      </div>
    );
  }

  return (
    address && (
      <>
        {isLoading || loadingGameData ? (
          <Loader message="Joining Battle..." />
        ) : (
          <>
            <p className=" text-gray-500">Select a Character</p>

            <div className="flex flex-row my-5  space-x-5">{content}</div>

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
                    <div
                      key={battle.battleId + index}
                      className={styles.flexBetween}
                    >
                      <p className={styles.joinBattleTitle}>
                        {index + 1}. {battle.name} {battle.battleId.toNumber()}
                      </p>
                      <CustomButton
                        title="Join"
                        handleClick={() =>
                          handleClick(
                            battle.name,
                            battle.battleId,
                            selectedTokenID
                          )
                        }
                        loading={!battleContract}
                      />
                    </div>
                  ))
              ) : (
                <p className={styles.joinLoading}>
                  Reload the page to see new battles
                </p>
              )}
            </div>

            <p
              className={styles.infoText}
              onClick={() => navigate("/create-battle")}
            >
              Or create a new battle
            </p>
          </>
        )}
      </>
    )
  );
};

export default PageHOC(
  JoinBattle,
  <>
    Challenge <br /> another to Battle
  </>,
  <>Join an already existing battle from below</>
);

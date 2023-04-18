import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactTooltip from "react-tooltip";
import {
  ThirdwebNftMedia,
  useContract,
  useContractRead,
  useContractWrite,
  useNFT,
} from "@thirdweb-dev/react";

import { useGlobalContext } from "../context";
import { alertIcon, gameRules, characters } from "../assets";
import { battleSkillsAddress, characterContractAddress } from "../contract";
import StatInput from "./StatInput";

import styles from "../styles";

const CharacterStats = (props) => {
  const tokenId = props?.tokenId;
  const [charInfo, setCharInfo] = useState(null);
  const [statPoints, setStatPoints] = useState(0);
  const [statChanges, setStatChanges] = useState(0);

  const keysWithButtons = ["strength", "dexterity", "intelligence", "vitality"];

  const navigate = useNavigate();
  const {
    characterContract,
    battleSkillsContract,
    gameData,
    setErrorMessage,
    setShowAlert,
    walletAddress,
  } = useGlobalContext();

  const { contract: charTWContract } = useContract(characterContractAddress);
  const { data: nftChar, isLoading, error } = useNFT(charTWContract, tokenId);
  const { data: getChar, isLoading: getCharLoad } = useContractRead(
    charTWContract,
    "getCharacter",
    [tokenId]
  );

  const { mutateAsync: addStats, isLoading: addStatsLoad } = useContractWrite(
    charTWContract,
    "addStats"
  );

  useEffect(() => {
    if (!getCharLoad && getChar) {
      const charStats = Object.entries(getChar)
        .filter(([key, value]) => isNaN(key))
        .reduce(
          (acc, [key, value]) => ({ ...acc, [key]: value.toNumber() }),
          {}
        );

      setCharInfo(charStats);
      setStatPoints(charStats.statPoints);
    }
  }, [getCharLoad, getChar]);

  const handleSaveChanges = async () => {
    try {
      const tx = await await addStats({
        args: [tokenId, strength, dexterity, intelligence, vitality],
      });

      console.log(tx);
      setShowAlert(true);
    } catch (error) {
      console.log(error);
      setErrorMessage(error.message);
      setShowAlert(true);
    }
  };

  return (
    <div
      className={`${styles.characterInfoPopup} z-50 ${
        props?.showInfo
          ? "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          : "top-0 right-0 translate-x-full"
      } ${styles.glassEffect} ${
        styles.flexBetween
      } backdrop-blur-3xl sm:w-[960px] w-full `}
    >
      <div className="flex flex-col">
        <div className={`${styles.flexBetween} gap-4 w-full`}>
          <h3 className={styles.gameInfoHeading}>
            {!isLoading && nftChar.metadata.name}
          </h3>
          <div className={styles.characterInfoClosePopup}>
            <div
              className={`${styles.flexCenter} ${styles.gameInfoSidebarClose}`}
              onClick={() => props?.handleClose(false)}
            >
              X
            </div>
          </div>
        </div>

        {isLoading && getCharLoad ? (
          <div>Loading...</div>
        ) : error || !nftChar ? (
          <div>NFT not found</div>
        ) : (
          <div className="md:flex justify-between items-center gap-2 w-full">
            <div className="sm:w-[350px] w-full">
              <ThirdwebNftMedia
                metadata={nftChar.metadata}
                width={300}
                className="rounded-xl"
              />
            </div>

            <div className="flex flex-col items-end mr-2">
              {getCharLoad ? (
                <div>Loading...</div>
              ) : (
                <div className="sm:w-[530px] w-full">
                  <div className="mb-3 mt-3 grid grid-cols-3 gap-3">
                    {keysWithButtons.map((key) => (
                      <div key={key} className={styles.characterAttributeBox}>
                        <StatInput
                          name={key}
                          stat={charInfo[key]}
                          statPoints={statPoints}
                          setStatPoints={setStatPoints}
                          setStatChanges={setStatChanges}
                          showButtons={true}
                        />
                      </div>
                    ))}
                    {Object.entries(charInfo)
                      .filter(([key, value]) =>
                        keysWithButtons.includes(key) ? false : !isNaN(key)
                      )
                      .map(([key, value]) => (
                        <div key={key} className={styles.characterAttributeBox}>
                          <StatInput
                            name={key}
                            stat={value}
                            statPoints={statPoints}
                            setStatPoints={setStatPoints}
                            setStatChanges={setStatChanges}
                            showButtons={false}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterStats;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import CustomButton from "./CustomButton";

import styles from "../styles";

const CharacterStats = (props) => {
  const tokenId = props?.tokenId;
  const [charInfo, setCharInfo] = useState(null);
  const [statPoints, setStatPoints] = useState(0);
  //   const [statChanges, setStatChanges] = useState(0);
  const [newStats, setNewStats] = useState({});

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
      if (charStats) {
        setNewStats({
          strength: charStats.strength,
          dexterity: charStats.dexterity,
          intelligence: charStats.intelligence,
          vitality: charStats.vitality,
        });
      }
    }
  }, [getCharLoad, getChar]);

  const handleSaveChanges = async () => {
    const diffStrength = newStats.strength - charInfo.strength;
    const diffDexterity = newStats.dexterity - charInfo.dexterity;
    const diffIntelligence = newStats.intelligence - charInfo.intelligence;
    const diffVitality = newStats.vitality - charInfo.vitality;

    try {
      const tx = await characterContract.addStats(
        tokenId,
        diffStrength,
        diffDexterity,
        diffIntelligence,
        diffVitality
      );

      console.log(tx);
      setShowAlert(true);
    } catch (error) {
      console.log(error);
      setErrorMessage(error.message);
      setShowAlert(true);
    }
  };

  const handleStatChange = (name, value) => {
    setNewStats((prevState) => ({ ...prevState, [name]: value }));
  };

  const resetNewStats = () => {
    setNewStats({
      strength: 0,
      dexterity: 0,
      intelligence: 0,
      vitality: 0,
    });
  };

  return (
    <div
      className={`${styles.characterInfoPopup} z-50 ${
        props?.showInfo
          ? "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          : "top-0 right-0 translate-x-full"
      } ${styles.glassEffect} ${
        styles.flexBetween
      } backdrop-blur-3xl sm:w-[1080px] w-full `}
    >
      <div className={`${styles.flexBetween} gap-4 w-full`}>
        <h3 className={styles.gameInfoHeading}>
          {!isLoading && nftChar.metadata.name}
        </h3>
        <div className={styles.characterInfoClosePopup}>
          <div
            className={`${styles.flexCenter} ${styles.gameInfoSidebarClose}`}
            onClick={() => {
              resetNewStats();
              props?.handleClose(false);
            }}
          >
            X
          </div>
        </div>
      </div>

      {isLoading || getCharLoad ? (
        <div>Loading...</div>
      ) : error || !nftChar ? (
        <div>NFT not found</div>
      ) : (
        <div className="md:flex justify-between items-center gap-2 w-full">
          <div className="sm:w-[250px] w-full text-center">
            <div className="flex-grow">
              <ThirdwebNftMedia
                metadata={nftChar.metadata}
                width={250}
                className="rounded-xl"
              />
              <p>Token ID : {nftChar.metadata.id}</p>
            </div>
            <div className={styles.characterAttributeBox}>
              <p>Stat Points Available</p>
              <span className="text-white text-lg font-semibold">
                {statPoints}
              </span>
            </div>
          </div>
          <div className="flex flex-1 items-end mr-2">
            {getCharLoad ? (
              <div>Loading...</div>
            ) : (
              <div className="sm:w-[600px] w-full">
                <div className="mb-3 mt-3 grid grid-rows-5 gap-3">
                  <div className="flex flex-row space-x-5 justify-center">
                    {keysWithButtons.map((key) => (
                      <div key={key} className={styles.characterAttributeBox}>
                        <StatInput
                          name={key}
                          stat={charInfo[key]}
                          statPoints={statPoints}
                          setStatPoints={setStatPoints}
                          //   setStatChanges={setStatChanges}
                          onStatChange={handleStatChange}
                          showButtons={true}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-row space-x-2">
                    {Object.entries(charInfo)
                      // eslint-disable-next-line no-confusing-arrow
                      .filter(([key, value]) =>
                        keysWithButtons.includes(key)
                          ? false
                          : !isNaN(value) &&
                            key !== "tokenId" &&
                            key !== "level" &&
                            key !== "typeId" &&
                            key !== "statPoints" &&
                            key !== "experience"
                      )
                      .map(([key, value]) => (
                        <div key={key} className={styles.characterAttributeBox}>
                          <StatInput
                            name={key}
                            stat={value}
                            statPoints={statPoints}
                            setStatPoints={setStatPoints}
                            // setStatChanges={setStatChanges}
                            showButtons={false}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
            <CustomButton
              title="Spend Stats"
              handleClick={handleSaveChanges}
              restStyles="mt-6"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterStats;

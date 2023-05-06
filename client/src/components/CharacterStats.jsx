import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ThirdwebNftMedia,
  useContract,
  useContractRead,
  useContractWrite,
  useNFT,
  useOwnedNFTs,
} from "@thirdweb-dev/react";

import { useGlobalContext } from "../context";
import { alertIcon, gameRules, characters } from "../assets";
import {
  battleItemsAddress,
  battleSkillsAddress,
  characterContractAddress,
} from "../contract";
import StatInput from "./StatInput";
import CustomButton from "./CustomButton";
import EquippedCharacterCard from "./EquippedCharacterCard";
import EquippedSkill from "./EqquippedSkill";

import styles from "../styles";

const CharacterStats = (props) => {
  const tokenId = props?.tokenId;
  const [charInfo, setCharInfo] = useState(null);
  const [statPoints, setStatPoints] = useState(0);
  const [newStats, setNewStats] = useState({});
  const [nftSkillData, setNftSkillData] = useState([]);
  const [nftItemData, setNftItemData] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [showButtons, setShowButtons] = useState(true);

  const keysWithButtons = ["strength", "dexterity", "intelligence", "vitality"];

  const navigate = useNavigate();
  const {
    characterContract,
    battleSkillsContract,
    battleItemsContract,
    gameData,
    setErrorMessage,
    setShowAlert,
    walletAddress,
  } = useGlobalContext();

  const { contract: charTWContract } = useContract(characterContractAddress);
  const { contract: skillTWContract } = useContract(battleSkillsAddress);
  const { contract: itemTWContract } = useContract(battleItemsAddress);

  const { data: ownedSkills } = useOwnedNFTs(skillTWContract, walletAddress);
  const { data: ownedItems } = useOwnedNFTs(itemTWContract, walletAddress);

  const { data: equippedSkills, isLoading: skillLoading } = useContractRead(
    charTWContract,
    "getEquippedSkills",
    [tokenId]
  );

  // const { data: equippedItem, isLoading: itemLoading } = useContractRead(
  //   charTWContract,
  //   "getEquippedItem",
  //   tokenId
  // );

  useEffect(() => {
    if (Array.isArray(equippedSkills) && equippedSkills.length > 0) {
      setNftSkillData(equippedSkills.map((skill) => skill.toNumber()));
    }
  }, [equippedSkills]);

  // useEffect(() => {
  //   if (equippedItem !== null && equippedItem !== undefined) {
  //     setNftItemData(equippedItem.toNumber());
  //   }
  // }, [equippedItem]);

  const { data: nftItem, isLoading: itemNFTLoading } = useNFT(
    itemTWContract,
    nftItemData
  );

  const { data: nftChar, isLoading } = useNFT(charTWContract, tokenId);
  const { data: getChar, isLoading: getCharLoad } = useContractRead(
    charTWContract,
    "getCharacter",
    [tokenId]
  );

  useEffect(() => {
    if (!getCharLoad && getChar) {
      const charStats = Object.entries(getChar)
        .filter(([key, value]) => isNaN(key))
        .reduce(
          (acc, [key, value]) => ({ ...acc, [key]: value.toNumber() }),
          {}
        );

      if (charStats && Object.keys(charStats).length > 0) {
        setCharInfo(charStats);
        setStatPoints(charStats.statPoints);

        if (
          charStats.strength &&
          charStats.dexterity &&
          charStats.intelligence &&
          charStats.vitality
        ) {
          setNewStats({
            strength: charStats.strength,
            dexterity: charStats.dexterity,
            intelligence: charStats.intelligence,
            vitality: charStats.vitality,
          });
        }
      }
    }
  }, [getCharLoad, getChar]);

  useEffect(() => {
    if (statPoints === 0 && !pendingChanges) {
      setShowButtons(false);
    } else {
      setShowButtons(true);
    }
  }, [statPoints, pendingChanges]);

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
      setPendingChanges(false);
      setShowAlert(true);
    } catch (error) {
      console.log(error);
      setErrorMessage(error.message);
      setShowAlert(true);
    }
  };

  const handleStatChange = (name, value) => {
    setNewStats((prevStats) => ({ ...prevStats, [name]: value }));
    setPendingChanges(true);
  };

  const resetNewStats = () => {
    setNewStats({
      strength: 0,
      dexterity: 0,
      intelligence: 0,
      vitality: 0,
    });
  };

  const handleEquipSkill = async (_skillId) => {
    try {
      const isApproved = await battleSkillsContract.isApprovedForAll(
        walletAddress,
        characterContractAddress
      );
      if (!isApproved) {
        await battleSkillsContract.setApprovalForAll(
          characterContractAddress,
          true
        );
      }
      await characterContract.equipSkill(tokenId, _skillId);
      console.info("contract call successs");
    } catch (err) {
      console.error("contract call failure", err);
    }
  };

  const handleUnequipSkill = async () => {
    try {
      const data = await characterContract.unequipSkill(tokenId);
      console.info("contract call successs", data);
    } catch (err) {
      console.error("contract call failure", err);
    }
  };

  const handleEquipItem = async (_tokenId) => {
    try {
      const itemApprove = await battleItemsContract.isApprovedForAll(
        walletAddress,
        characterContractAddress
      );
      if (!itemApprove) {
        await battleItemsContract.setApprovalForAll(
          characterContractAddress,
          true
        );
      }
      await characterContract.equipItem(tokenId, _tokenId);
      console.info("contract call successs");
    } catch (err) {
      console.error("contract call failure", err);
    }
  };

  const handleUnequipItem = async () => {
    try {
      const data = await characterContract.unequipItem(tokenId);
      console.info("contract call successs", data);
    } catch (err) {
      console.error("contract call failure", err);
    }
  };

  let skills;
  if (Array.isArray(ownedSkills) && ownedSkills.length > 0) {
    skills = ownedSkills.map((c, i) => (
      <div
        key={c.metadata.id}
        onClick={() => {
          handleEquipSkill(c.metadata.id);
        }}
        className={`${styles.flexCenter} ${styles.RecruitmentSkillItemCard}`}
      >
        <ThirdwebNftMedia
          metadata={c.metadata}
          className={styles.recruitmentCardImg}
          width={50}
          height={50}
        />
        <div className="info absolute p-2">
          <CustomButton
            title="Equip"
            handleclick={() => {
              handleEquipSkill(c.metadata.id);
            }}
          />
        </div>
      </div>
    ));
  } else {
    skills = (
      <div
        className={`${styles.flexCenter} ${styles.RecruitmentSkillItemCard}`}
      >
        {equippedSkills === 9999 ? (
          <p>You don't own an skill!</p>
        ) : (
          <p>Skill equipped!</p>
        )}
      </div>
    );
  }

  // let items;
  // if (Array.isArray(ownedItems) && ownedItems.length > 0) {
  //   items = ownedItems.map((c, i) => (
  //     <div
  //       key={c.metadata.id}
  //       onClick={() => {
  //         handleEquipItem(c.metadata.id);
  //       }}
  //     >
  //       <ThirdwebNftMedia
  //         metadata={c.metadata}
  //         className={styles.recruitmentCardImg}
  //         width={50}
  //         height={50}
  //       />
  //       <div className="info absolute p-2">
  //         <CustomButton
  //           title="Equip"
  //           handleclick={() => {
  //             handleEquipItem(c.metadata.id);
  //           }}
  //           restStyles="mt-6 mb-6"
  //         />
  //       </div>
  //     </div>
  //   ));
  // } else {
  //   items = (
  //     <div
  //       className={`${styles.flexCenter} ${styles.RecruitmentSkillItemCard}`}
  //     >
  //       <p>You don't own an item!</p>
  //     </div>
  //   );
  // }

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
      ) : !nftChar ? (
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
            {skillLoading || nftSkillData.length === 0 ? (
              <p>Loading equipped skills...</p>
            ) : (
              nftSkillData.map((skillId) => (
                <EquippedSkill
                  key={skillId}
                  contract={skillTWContract}
                  Id={skillId}
                  handleUnequip={handleUnequipSkill}
                />
              ))
            )}
            {/* {itemLoading || nftItemData === null ? (
              <p>Loading equipped item...</p>
            ) : (
              <EquippedCharacterCard
                itemType="Item"
                equippedItem={equippedItem}
                loading={itemLoading}
                nftData={nftItem}
                nftLoading={itemNFTLoading}
                onUnequip={() => handleUnequipItem()}
              />
            )} */}
          </div>
          <div className="flex flex-1 items-end mr-2">
            {getCharLoad ? (
              <div>Loading...</div>
            ) : (
              <div className="sm:w-[600px] w-full">
                <div className="mb-3 mt-3 grid grid-rows-5 gap-3">
                  <div className="flex flex-row space-x-5 items-center justify-center">
                    {keysWithButtons.map((key) => (
                      <div key={key} className={styles.characterAttributeBox}>
                        <StatInput
                          name={key}
                          stat={charInfo[key]}
                          statPoints={statPoints}
                          setStatPoints={setStatPoints}
                          onStatChange={handleStatChange}
                          showButtons={showButtons}
                        />
                      </div>
                    ))}
                    {showButtons && (
                      <CustomButton
                        title="Spend Stats"
                        handleClick={handleSaveChanges}
                      />
                    )}
                  </div>
                  <div className="flex flex-row space-x-2 items-center justify-center">
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
                            showButtons={false}
                          />
                        </div>
                      ))}
                  </div>
                  <div className="text-center">
                    <p>Owned Skills</p>
                    <div className="flex flex-row space-x-2 items-center justify-start m-1">
                      {skills}
                    </div>
                  </div>
                  <div className="text-center">
                    <p>Owned Items</p>
                    <div className="flex flex-row space-x-2 items-center justify-start m-1">
                      {/* {items} */}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterStats;

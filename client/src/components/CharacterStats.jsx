import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ThirdwebNftMedia,
  useContract,
  useContractRead,
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
import {
  ItemSlots,
  SkillSlots,
  StatInput,
  CustomButton,
  EquippedCharacterCard,
  EquippedSkill,
} from ".";

import styles from "../styles";

const CharacterStats = (props) => {
  const tokenId = props?.tokenId;
  const [charInfo, setCharInfo] = useState(null);
  const [statPoints, setStatPoints] = useState(0);
  const [newStats, setNewStats] = useState({});
  const [pendingChanges, setPendingChanges] = useState(false);
  const [showButtons, setShowButtons] = useState(true);

  const keysWithButtons = ["strength", "dexterity", "intelligence", "vitality"];

  const navigate = useNavigate();
  const {
    characterContract,
    battleSkillsContract,
    battleItemsContract,
    setErrorMessage,
    setShowAlert,
    walletAddress,
    setEquippedSkills,
    setEquippedSkillLoading,
    localOwnedSkills,
    setLocalOwnedSkills,
    localOwnedItems,
    setLocalOwnedItems,
    setEquippedItems,
    setEquippedItemLoading,
    allOwnedSkills,
    setAllOwnedSkills,
    setAllOwnedItems,
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

  useEffect(() => {
    if (ownedSkills) {
      setLocalOwnedSkills(ownedSkills);
      setAllOwnedSkills(ownedSkills);
    }
  }, [ownedSkills, setLocalOwnedSkills]);

  useEffect(() => {
    if (ownedItems) {
      setLocalOwnedItems(ownedItems);
      setAllOwnedItems(ownedItems);
    }
  }, [ownedItems, setLocalOwnedItems]);

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
    setEquippedSkillLoading(true);
    try {
      const isApproved = await battleSkillsContract.isApprovedForAll(
        walletAddress,
        characterContractAddress
      );
      if (!isApproved) {
        const approvalTx = await battleSkillsContract.setApprovalForAll(
          characterContractAddress,
          true
        );
        await approvalTx.wait(); // wait for the approval transaction to be mined
      }

      const equipTx = await characterContract.equipSkill(tokenId, _skillId);
      console.log("Waiting for equip transaction to confirm...");
      await equipTx.wait(); // wait for the equip transaction to be mined
      setEquippedSkillLoading(false);

      console.info("contract call successs");

      const newOwnedSkills = localOwnedSkills.filter(
        (skill) => skill.metadata.id !== _skillId
      );
      setLocalOwnedSkills(newOwnedSkills);

      setEquippedSkills((prevEquippedSkills) => {
        const newEquippedSkills = [...prevEquippedSkills];
        const firstEmptySlotIndex = newEquippedSkills.findIndex(
          (skillId) => skillId === null
        );
        if (firstEmptySlotIndex !== -1) {
          newEquippedSkills[firstEmptySlotIndex] = _skillId;
        }
        return newEquippedSkills;
      });
    } catch (err) {
      console.error("contract call failure", err);
    }
  };

  const handleEquipItem = async (_itemTokenId, _itemType) => {
    console.log(_itemTokenId, _itemType);
    const itemTypes = [
      { type: 0, name: "Weapon" },
      { type: 1, name: "Headgear" },
      { type: 2, name: "Body Armor" },
      { type: 3, name: "Pants" },
      { type: 4, name: "Footwear" },
    ];
    setEquippedItemLoading(true);
    try {
      const isApproved = await battleItemsContract.isApprovedForAll(
        walletAddress,
        characterContractAddress
      );
      if (!isApproved) {
        const approvalTx = await battleItemsContract.setApprovalForAll(
          characterContractAddress,
          true
        );
        await approvalTx.wait(); // wait for the approval transaction to be mined
      }

      const equipTx = await characterContract.equipItem(tokenId, _itemTokenId);
      console.log("Waiting for equip transaction to confirm...");
      await equipTx.wait(); // wait for the equip transaction to be mined

      console.info("contract call successs");

      const newOwnedItems = localOwnedItems.filter(
        (item) => item.metadata.id !== _itemTokenId
      );
      setLocalOwnedItems(newOwnedItems);

      setEquippedItems((prevEquippedItems) => {
        const newEquippedItems = { ...prevEquippedItems };
        const itemType = itemTypes.find(
          (item) => item.type === _itemType
        )?.name;
        console.log(itemType);
        if (itemType) {
          console.log(newEquippedItems[itemType]);
          newEquippedItems[itemType] = _itemTokenId;
        }
        console.log(newEquippedItems);
        return newEquippedItems;
      });
      setEquippedItemLoading(false);
    } catch (err) {
      console.error("contract call failure", err);
    }
  };

  let skills;
  if (Array.isArray(localOwnedSkills) && localOwnedSkills.length > 0) {
    skills = localOwnedSkills.map((c, i) => (
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
          width={100}
          height={100}
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
          <p>No skills available!</p>
        ) : (
          <p>Skill equipped!</p>
        )}
      </div>
    );
  }

  let items;
  if (Array.isArray(localOwnedItems) && localOwnedItems.length > 0) {
    items = localOwnedItems.map((c, i) => (
      <div
        key={c.metadata.id}
        onClick={() => {
          handleEquipItem(c.metadata.id, c.metadata.attributes[5].value);
        }}
        className={`${styles.flexCenter} ${styles.RecruitmentSkillItemCard}`}
      >
        <ThirdwebNftMedia
          metadata={c.metadata}
          className={styles.recruitmentCardImg}
          width={100}
          height={100}
        />
        <div className="info absolute p-2">
          <CustomButton
            title="Equip"
            handleclick={() => {
              handleEquipItem(c.metadata.id, c.metadata.attributes[5].value);
            }}
            restStyles="mt-6 mb-6"
          />
        </div>
      </div>
    ));
  } else {
    items = (
      <div
        className={`${styles.flexCenter} ${styles.RecruitmentSkillItemCard}`}
      >
        <p>No items available!</p>
      </div>
    );
  }

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
            {charTWContract && skillTWContract && (
              <SkillSlots
                charTWContract={charTWContract}
                skillTWContract={skillTWContract}
                tokenId={tokenId}
              />
            )}

            {charTWContract && itemTWContract && (
              <ItemSlots
                charTWContract={charTWContract}
                itemTWContract={itemTWContract}
                tokenId={tokenId}
              />
            )}
          </div>
          <div className="flex flex-1 items-end mr-2">
            {getCharLoad ? (
              <div>Loading...</div>
            ) : (
              <div className="sm:w-[600px] w-full">
                <div className="mb-3 mt-3 grid grid-rows-5 gap-3">
                  {charInfo && (
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
                  )}

                  <div className="flex flex-row space-x-2 items-center justify-center">
                    {charInfo &&
                      Object.entries(charInfo)
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
                          <div
                            key={key}
                            className={styles.characterAttributeBox}
                          >
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
                      {items}
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

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

import CustomButton from "./CustomButton";
import { useGlobalContext } from "../context";
import { alertIcon, gameRules, characters } from "../assets";
import {
  battleSkillsAddress,
  characterContractAddress,
  equipManagementAddress,
} from "../contract";
import { Loader } from "../components";

import styles from "../styles";

const CharacterInfo = (props) => {
  const navigate = useNavigate();
  const {
    characterContract,
    battleSkillsContract,
    gameData,
    setErrorMessage,
    setShowAlert,
    address,
  } = useGlobalContext();
  const tokenId = props?.tokenId;
  const characterInfo = characters.filter((item) => {
    return item.characterType == props?.tokenId;
  })[0];
  const [loading, setLoading] = useState(false);

  const mintCharacter = async () => {
    setLoading(true);
    try {
      // const isApproved = await battleSkillsContract.call("isApprovedForAll", [
      //   { address, equipManagementAddress },
      // ]);

      // if (!isApproved) {
      //   const approvalTx = await battleSkillsContract.call(
      //     "setApprovalForAll",
      //     [equipManagementAddress, true]
      //   );

      //   await approvalTx.wait();
      // }

      const mintTx = await characterContract.call(
        "mintNewCharacterWithItemAndEquip",
        [characterInfo.characterType, address, characterInfo.skillId]
      );

      console.log(mintTx);

      // await mintTx.wait();

      setShowAlert({
        status: true,
        type: "info",
        message: `${characterInfo.name} is minted!`,
      });

      setTimeout(() => navigate("/my-champions"), 2000);
    } catch (error) {
      console.log("error", error);
      setErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader message="Creating Character, Confirm transaction." />}
      <div
        className={`${styles.characterInfoPopup} ${
          props?.showInfo
            ? "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            : "top-0 right-0 translate-x-full"
        } ${styles.glassEffect} ${
          styles.flexBetween
        } backdrop-blur-3xl sm:w-[960px] w-full `}
      >
        <div className="flex flex-col">
          <div className={`${styles.flexBetween} gap-4 w-full`}>
            <h3 className={styles.gameInfoHeading}>{characterInfo?.name}</h3>
            <div className={styles.characterInfoClosePopup}>
              <div
                className={`${styles.flexCenter} ${styles.gameInfoSidebarClose}`}
                onClick={() => props?.handleClose(false)}
              >
                X
              </div>
            </div>
          </div>

          <div className={`md:flex justify-between items-center gap-2 w-full`}>
            <div className="sm:w-[350px] w-full">
              <img src={characterInfo?.image} className="rounded-[10px]" />
            </div>
            <div className="sm:w-[530px] w-full">
              <div className="mb-3 mt-3 grid grid-cols-3 gap-3">
                {characterInfo?.attributes &&
                  Object.entries(characterInfo.attributes).map(
                    (value, index) => (
                      <div
                        key={`game-rule-${index}`}
                        className={styles.characterAttributeBox}
                      >
                        <p className="font-bold">
                          {" "}
                          {value[0].toUpperCase().split("_").join(" ")}
                        </p>
                        <span> {value[1]} </span>
                      </div>
                    )
                  )}
              </div>

              <div className="text-white mb-3">
                <h3 className={styles.characterInfoHeading}>
                  {characterInfo?.type}
                </h3>

                <img
                  data-tooltip-content={characterInfo?.value}
                  data-tooltip-id={`Character-${characterInfo?.tokenId}`}
                  className={`${styles.playerImg} cursor-pointer w-14 h-14`}
                  src={characterInfo?.icon}
                />
                <Tooltip
                  id={`Character-${characterInfo?.tokenId}`}
                  place="right"
                  effect="solid"
                  style={{ backgroundColor: "#7f46f0" }}
                  className="max-w-[450px] whitespace-pre-wrap break-words"
                  render={() => (
                    <>
                      <p className="font-bold text-[17px]">
                        {characterInfo?.value}
                      </p>
                      <p className={styles.characterInfo}>
                        {characterInfo?.tooltip}
                      </p>
                      <ul className="text-[14px] mt-1">
                        <li>
                          <span className="font-bold">Mana Cost : </span>
                          {characterInfo?.mana_cost}
                        </li>
                        <li>
                          <span className="font-bold">Damage : </span>
                          {characterInfo?.damage}
                        </li>
                        <li>
                          <span className="font-bold">Effect : </span>
                          {characterInfo?.effect}
                        </li>
                      </ul>
                    </>
                  )}
                />
              </div>
              <CustomButton title="Mint" handleClick={() => mintCharacter()} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CharacterInfo;

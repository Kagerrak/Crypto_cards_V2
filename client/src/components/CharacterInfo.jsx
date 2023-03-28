import React, { useState } from "react";
import CustomButton from "./CustomButton";
import { useGlobalContext } from "../context";
import { alertIcon, gameRules, characters } from "../assets";
import ReactTooltip from "react-tooltip";
import styles from "../styles";
import { useNavigate } from "react-router-dom";

const CharacterInfo = (props) => {
  if (!props?.tokenId) return;
  const navigate = useNavigate();
  const { contract, gameData, setErrorMessage, setShowAlert, walletAddress } =
    useGlobalContext();
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const tokenId = props?.tokenId;
  const modalType = props?.modalType;
  const selected = props?.selected == tokenId ? true : false;
  const characterInfo = characters.filter((item) => {
    return item.tokenId == props?.tokenId;
  })[0];

  const mintCharacter = async () => {
    try {
      const playerExists = await contract.isPlayer(walletAddress);
      console.log({ playerExists, walletAddress });
      if (playerExists) {
        const fees = await contract.currentFee(tokenId);
        await contract.mintCharacter(tokenId, {
          gasLimit: 500000,
          value: fees,
        });

        setShowAlert({
          status: true,
          type: "info",
          message: `${characterInfo.name} is minted!`,
        });

        setTimeout(() => navigate("/my-champions"), 10000);
      }
    } catch (error) {
      console.log("error", error);
      setErrorMessage(error);
    }
  };

  const switchCharacter = async () => {
    try {
      const playerExists = await contract.isPlayer(walletAddress);
      const balance = await contract.balanceOf(walletAddress, tokenId);
      let error = {};
      if (!playerExists) {
        error = { message: "Player not exists!" };
        throw error;
      }

      if (balance.toNumber() == 0) {
        error = { message: "Charater not minted!" };
        throw error;
      }

      await contract.switchCharacter(tokenId, { gasLimit: 500000 });

      setShowAlert({
        status: true,
        type: "info",
        message: `Character switched to ${characterInfo.name}!`,
      });

      setTimeout(() => navigate("/create-battle"), 1000);
    } catch (error) {
      console.log("error", error);
      setErrorMessage(error);
    }
  };

  return (
    <>
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
                {Object.entries(characterInfo?.attributes).map(
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
                  data-for={`Character-${characterInfo?.tokenId}`}
                  data-tip={characterInfo?.value}
                  className={`${styles.playerImg} cursor-pointer`}
                  src={characterInfo?.icon}
                />

                <ReactTooltip
                  id={`Character-${characterInfo?.tokenId}`}
                  place="right"
                  effect="solid"
                  backgroundColor="#7f46f0"
                >
                  <p className={styles.characterInfo}>
                    {characterInfo?.tooltip}
                  </p>
                  <ul>
                    <li>
                      <span className="font-bold"> Mana Cost:</span>{" "}
                      {characterInfo?.mana_cost}
                    </li>
                    <li>
                      <span className="font-bold">Damage:</span>{" "}
                      {characterInfo?.damage}
                    </li>
                    <li>
                      <span className="font-bold">Effect:</span>{" "}
                      {characterInfo?.effect}
                    </li>
                  </ul>
                </ReactTooltip>
              </div>

              {modalType === 1 ? (
                <CustomButton
                  title="Mint"
                  handleClick={() => mintCharacter()}
                />
              ) : selected ? (
                <p className="text-white font-bold">Currently used in Games</p>
              ) : (
                <CustomButton
                  title="Use In Game"
                  handleClick={() => switchCharacter()}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CharacterInfo;

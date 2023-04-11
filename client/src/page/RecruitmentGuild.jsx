import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "../styles";
import { Alert } from "../components";
import { characters } from "../assets";
import { useGlobalContext } from "../context";
import { CustomButton } from "../components";
import { CharacterInfo } from "../components";

const RecruitmentGuild = () => {
  const navigate = useNavigate();
  const { setBattleGround, setShowAlert, showAlert } = useGlobalContext();
  const [showInfo, setShowInfo] = useState(false);
  const [characterType, setCharacterType] = useState();

  const handleAction = (tokenId) => {
    setShowInfo(!showInfo);
    setCharacterType(tokenId);
  };

  return (
    <div className={`${styles.flexCenter} ${styles.battlegroundContainer}`}>
      {showAlert.status && (
        <Alert type={showAlert.type} message={showAlert.message} />
      )}

      <h1 className={`${styles.headText} text-center`}>
        Recruitment
        <span className="text-siteViolet"> Guild </span>
      </h1>

      <ul className="flex gap-2 mt-10">
        <li>
          <a
            onClick={() => navigate("/recruitment-guild")}
            href={undefined}
            className={`${styles.linkActive} `}
          >
            All Champions
          </a>
        </li>
        <li>
          <a
            onClick={() => navigate("/my-champions")}
            href={undefined}
            className={styles.linkText}
          >
            My Champions
          </a>
        </li>
      </ul>
      <div className={`${styles.flexCenter} ${styles.battleGroundsWrapper}`}>
        {characters.map((character) => (
          <div
            key={character.characterType}
            className={`${styles.flexCenter} ${styles.recruitmentGroundCard}`}
            onClick={() => {
              setShowInfo(!showInfo);
              setCharacterType(character.characterType);
            }}
          >
            <img
              src={character.image}
              alt={character.name}
              className={styles.recruitmentCardImg}
            />
            <div className="info absolute p-2">
              <p className={styles.recruitmentCardText}>
                {character.attributes.tooltip}
              </p>
              <CustomButton
                title="More Info"
                handleclick={() => {
                  handleAction(character.characterType);
                }}
                restStyles="mt-6 mb-6"
              />
            </div>
          </div>
        ))}
        <CharacterInfo
          modalType={1}
          showInfo={showInfo}
          handleClose={() => {
            setShowInfo(false);
          }}
          tokenId={characterType}
        />
      </div>
      <div className="h-500"></div>
    </div>
  );
};

export default RecruitmentGuild;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import styles from "../styles";
import { Alert } from "../components";
import { characters } from "../assets";
import { useGlobalContext } from "../context";
import { CustomButton } from "../components";
import { CharacterInfo } from "../components";

const MyChampion = () => {
  const navigate = useNavigate();
  const {
    setBattleGround,
    setShowAlert,
    showAlert,
    characterContract,
    walletAddress,
  } = useGlobalContext();
  const [showInfo, setShowInfo] = useState(false);
  const [tokenId, setTokenId] = useState();
  const [champions, setChampions] = useState(null);
  const [characterToken, setCharacterToken] = useState(0);

  useEffect(() => {
    if (!characterContract) return;

    const filter = async (arr, callback) => {
      const fail = Symbol();
      return (
        await Promise.all(
          arr.map(async (item) => ((await callback(item)) ? item : fail))
        )
      ).filter((i) => i !== fail);
    };

    const fetchCharacters = async () => {
      const results = await filter(characters, async (item) => {
        const balance = await characterContract.balanceOf(walletAddress);
        return balance.toNumber() > 0;
      });
      // const p1TokenData = await contract.getPlayerToken(walletAddress);
      // setCharacterToken(p1TokenData.id.toNumber());
      setChampions(results);
    };

    fetchCharacters();
  }, []);

  const handleAction = (id) => {
    console.log(id);
    setShowInfo(!showInfo);
    setTokenId(id);
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
            className={`${styles.linkText} `}
          >
            All Champions
          </a>
        </li>
        <li>
          <a
            onClick={() => navigate("/my-champions")}
            href={undefined}
            className={styles.linkActive}
          >
            My Champions
          </a>
        </li>
      </ul>

      <div className={`${styles.flexCenter} ${styles.battleGroundsWrapper}`}>
        {champions ? (
          champions.length > 0 ? (
            champions.map((character) => (
              <div
                key={character.characterType}
                className={
                  characterToken === character.tokenId
                    ? `selected-card ${styles.flexCenter} ${styles.recruitmentGroundCard}`
                    : `${styles.flexCenter} ${styles.recruitmentGroundCard}`
                }
                onClick={() => {
                  setShowInfo(!showInfo);
                  setTokenId(character.characterType);
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
            ))
          ) : (
            <p className={`${styles.notFoundText}`}>
              No Champions Found. Please Mint One.
            </p>
          )
        ) : (
          <p className="text-white">Loading...</p>
        )}
        <CharacterInfo
          modalType={2}
          showInfo={showInfo}
          handleClose={() => {
            setShowInfo(false);
          }}
          // selected={characterToken}
          tokenId={tokenId}
        />
      </div>
      <div className="h-500"></div>
    </div>
  );
};

export default MyChampion;

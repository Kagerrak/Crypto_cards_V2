import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useContract,
  useContractWrite,
  useOwnedNFTs,
  ThirdwebNftMedia,
} from "@thirdweb-dev/react";

import styles from "../styles";
import { Alert, CharacterStats } from "../components";
import { characters } from "../assets";
import { useGlobalContext } from "../context";
import { CustomButton } from "../components";
import { CharacterInfo } from "../components";
import { battleSkillsAddress, characterContractAddress } from "../contract";

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

  // Get contract instance with thirdweb
  const { contract: charTWContract } = useContract(characterContractAddress);
  const { contract: skillTWContract } = useContract(battleSkillsAddress);

  // Fetch owner character NFTs
  const { data: ownedNfts, isLoading } = useOwnedNFTs(
    charTWContract,
    walletAddress
  );

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

      setChampions(results);
    };

    fetchCharacters();
  }, []);

  const handleAction = (id) => {
    console.log(id);
    setShowInfo(!showInfo);
    setTokenId(id);
  };

  let content;
  if (Array.isArray(ownedNfts) && ownedNfts.length > 0) {
    content = ownedNfts.map((c, i) => (
      <div
        key={c.metadata.id}
        className={`${styles.flexCenter} ${styles.recruitmentGroundCard}`}
        onClick={() => {
          handleAction(c.metadata.id);
        }}
      >
        <ThirdwebNftMedia
          metadata={c.metadata}
          className={styles.recruitmentCardImg}
        />
        <div className="info absolute p-2">
          <CustomButton
            title="More Info"
            handleclick={() => {
              handleAction(c.metadata.id);
            }}
            restStyles="mt-6 mb-6"
          />
        </div>
      </div>
    ));
  } else {
    content = (
      <div className={`${styles.flexCenter} ${styles.recruitmentGroundCard}`}>
        <p>You don't have a character!</p>
        <p>Create one and join the battle!</p>
      </div>
    );
  }

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
        {isLoading ? <p>Loading...</p> : content}
        <CharacterStats
          showInfo={showInfo}
          handleClose={() => {
            setShowInfo(false);
          }}
          tokenId={tokenId}
        />
      </div>
      <div className="h-500" />
    </div>
  );
};

export default MyChampion;

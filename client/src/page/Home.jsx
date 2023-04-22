import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CustomButton, PageHOC, Loader } from "../components";
import { useGlobalContext } from "../context";

const Home = () => {
  const {
    characterContract,
    walletAddress,
    gameData,
    setShowAlert,
    setErrorMessage,
  } = useGlobalContext();
  const [typeID, setTypeID] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingGameData, setLoadingGameData] = useState(true);

  const navigate = useNavigate();

  const handleClick = async () => {
    try {
      setIsLoading(true);
      const tx = await characterContract.newCharacter(typeID);

      await tx.wait(1);

      setIsLoading(false);

      setShowAlert({
        status: true,
        type: "info",
        message: `Character of type ${typeID} is being created!`,
      });

      setTimeout(() => navigate("/create-battle"), 8000);
    } catch (error) {
      setErrorMessage(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (gameData) {
      setLoadingGameData(false);
      if (gameData.activeBattle && gameData.activeBattle.battleStatus === 1) {
        console.log(
          "Navigating to battle from Home:",
          gameData.activeBattle.name
        );
        navigate(`/battle/${gameData.activeBattle.name}`);
      }
    }
  }, [gameData, navigate]);

  useEffect(() => {
    const createCharacter = async () => {
      const hasCharacter = await characterContract.balanceOf(walletAddress);

      if (hasCharacter.toNumber() > 0) navigate("/create-battle");
    };

    if (characterContract) createCharacter();
  }, [characterContract, walletAddress]);

  return (
    walletAddress && (
      <>
        {isLoading || loadingGameData ? (
          <Loader message="Creating Character... Please wait..." />
        ) : (
          <div className="flex flex-col">
            <div className="flex flex-col justify-between">
              <label>
                <input
                  type="radio"
                  name="characterType"
                  value="0"
                  onChange={(e) => setTypeID(parseInt(e.target.value))}
                />
                Warrior
              </label>
              <label>
                <input
                  type="radio"
                  name="characterType"
                  value="1"
                  onChange={(e) => setTypeID(parseInt(e.target.value))}
                />
                Mage
              </label>
              <label>
                <input
                  type="radio"
                  name="characterType"
                  value="2"
                  onChange={(e) => setTypeID(parseInt(e.target.value))}
                />
                Rogue
              </label>
            </div>
            <CustomButton
              title="Create Character"
              handleClick={handleClick}
              restStyles="mt-6"
            />
          </div>
        )}
      </>
    )
  );
};

export default PageHOC(
  Home,
  <>
    Welcome to Avax Gods <br /> a Web3 NFT Card Game
  </>,
  <>
    Connect your wallet to start playing <br /> the ultimate Web3 Battle Card
    Game
  </>
);

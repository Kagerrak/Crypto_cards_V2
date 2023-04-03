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
  const navigate = useNavigate();

  const handleClick = async () => {
    try {
      setIsLoading(true);
      const tx = await characterContract.newCharacter(typeID, {
        gasLimit: 500000,
      });

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
    }
  };

  useEffect(() => {
    if (gameData?.activeBattle?.battleStatus === 1) {
      navigate(`/battle/${gameData.activeBattle.name}`);
    }
  }, [gameData]);

  useEffect(() => {
    const createCharacter = async () => {
      const hasCharacter = await characterContract.balanceOf(walletAddress);

      if (hasCharacter) navigate("/create-battle");
    };

    if (characterContract) createCharacter();
  }, [characterContract, walletAddress]);

  return (
    walletAddress && (
      <>
        {isLoading ? (
          <Loader />
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

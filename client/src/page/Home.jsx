import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CustomButton, PageHOC, Loader } from "../components";
import { characters } from "../assets";
import { useGlobalContext } from "../context";

const Home = () => {
  const {
    characterContract,
    address,
    gameData,
    setShowAlert,
    setErrorMessage,
  } = useGlobalContext();
  const [typeID, setTypeID] = useState(null);
  const [charName, setCharName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingGameData, setLoadingGameData] = useState(true);

  const navigate = useNavigate();

  const handleClick = async () => {
    try {
      setIsLoading(true);
      await characterContract.call("newCharacter", [typeID]);
      console.log("run");

      setIsLoading(false);

      setShowAlert({
        status: true,
        type: "info",
        message: `A ${charName} character is being created!`,
      });

      setTimeout(() => navigate("/create-battle"), 8000);
    } catch (error) {
      setErrorMessage(error);
      console.log(error);
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
    if (characterContract === undefined) {
      return;
    }
    const createCharacter = async () => {
      const hasCharacter = await characterContract.call("balanceOf", [address]);
      console.log(hasCharacter.toNumber());

      if (hasCharacter.toNumber() > 0) navigate("/create-battle");
    };

    if (characterContract) createCharacter();
  }, [characterContract, address]);

  return (
    address && (
      <>
        {isLoading || loadingGameData ? (
          <Loader message="Creating Character... Please wait..." />
        ) : (
          <div className="flex flex-col space-y-4">
            <div className="flex space-x-4">
              {characters.map((character) => (
                <div
                  key={character.characterType}
                  className={`border-2 border-gray-400 rounded-lg overflow-hidden hover:border-blue-400 text-gray-300
                    ${
                      typeID === character.characterType
                        ? "border-red-400 hover:border-red-400 animate-pulse "
                        : ""
                    }`}
                  onClick={() => {
                    setTypeID(
                      typeID === character.characterType
                        ? null
                        : character.characterType
                    );
                    setCharName(
                      charName === character.name ? null : character.name
                    );
                  }}
                >
                  <img
                    src={character.image}
                    alt={character.name}
                    className="w-24 h-24 object-cover mx-auto"
                  />
                  <p className="p-4">{character.name}</p>
                </div>
              ))}
            </div>
            <div>
              <CustomButton
                title="Create Character"
                handleClick={handleClick}
                restStyles="mt-6"
              />
            </div>
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

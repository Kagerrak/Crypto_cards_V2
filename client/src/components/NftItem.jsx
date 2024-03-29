import React, { useState, useEffect } from "react";
import { ThirdwebNftMedia } from "@thirdweb-dev/react";

import { badge } from "../assets";
import { useGlobalContext } from "../context";

const ProgressBar = ({ value, max, color, exp }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="w-full h-2 bg-gray-300 rounded mb-1 relative">
      <div
        className={`h-full ${color} rounded`}
        style={{ width: `${percentage}%` }}
      />
      <span className="text-[12px] text-gray-800 font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {value}
        {exp && `/${max}`}
      </span>
    </div>
  );
};

const NftItem = ({ metadata, isSelected, onSelect, contract }) => {
  const [charMana, setCharMana] = useState(null);
  const [charMaxMana, setCharMaxMana] = useState(null);
  const [charStamina, setCharStamina] = useState(null);
  const [charExperience, setCharExperience] = useState(null);
  const [charLevel, setCharLevel] = useState(null);
  const [maxExperience, setMaxExperience] = useState(null);
  const baseXP = 100;

  const { characterContract } = useGlobalContext();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const mana = await characterContract.call("getMana", [metadata.id]);
        const stamina = await characterContract.call("getStamina", [
          metadata.id,
        ]);
        const maxMana = await characterContract.call("getRecoveryStats", [
          metadata.id,
        ]);
        const character = await characterContract.call("getCharacter", [
          metadata.id,
        ]);
        const { experience } = character;
        const { level } = character;
        const maxExp = level * baseXP;

        const totalExpUpToLevel = ((_level, _baseXP) => {
          let totalXP = 0;
          for (let i = 1; i < _level; i++) {
            totalXP += i * _baseXP;
          }
          return totalXP;
        })(level, baseXP);

        const currentLevelExp = experience.toNumber() - totalExpUpToLevel;
        const currentMaxExp = maxExp;

        setCharMana(mana.toNumber());
        setCharMaxMana(maxMana.maxMana.toNumber());
        setCharStamina(stamina.toNumber());
        setCharExperience(currentLevelExp);
        setCharLevel(level.toNumber());
        setMaxExperience(currentMaxExp);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [metadata.id, contract]);

  if (
    charMana === null ||
    charStamina === null ||
    charExperience === null ||
    charLevel === null ||
    maxExperience === null
  ) {
    return null;
  }

  return (
    <div
      className={`border-2 border-gray-400 rounded-lg overflow-hidden hover:border-blue-400 
        ${
          isSelected ? "border-red-400 hover:border-red-400 animate-pulse " : ""
        }`}
      onClick={() => onSelect(isSelected ? null : metadata.id)}
    >
      <div className="relative">
        <div
          className="absolute top-[-23px] left-[-3px] m-2 flex items-center justify-center 
      h-7 w-7 rounded-full text-white font-bold"
        >
          <img
            src={badge}
            alt="badge"
            className="w-full h-full rounded-full object-cover"
          />
          <span className="absolute">{charLevel}</span>
        </div>
        <ThirdwebNftMedia
          metadata={metadata}
          height={180}
          width={200}
          className="drop-shadow-lg mt-4"
        />
        <div className="bottom-0 left-0 mb-2 flex flex-col space-y-1 w-full px-2 text-gray-300">
          {charMana !== null && (
            <>
              <div className="text-[12px] text-gray-300">Mana</div>
              <ProgressBar
                value={charMana}
                max={charMaxMana}
                color="bg-blue-700"
              />
            </>
          )}
          {charStamina !== null && (
            <>
              <div className="text-[12px] text-gray-300">Stamina</div>
              <ProgressBar value={charStamina} max={100} color="bg-green-700" />
            </>
          )}
          {charExperience !== null &&
            charLevel !== null &&
            maxExperience !== null && (
              <>
                <div className="text-[12px] text-gray-300">Experience</div>
                <ProgressBar
                  value={charExperience}
                  max={maxExperience}
                  color="bg-yellow-500"
                  exp
                />
              </>
            )}
        </div>
      </div>
    </div>
  );
};

export default NftItem;

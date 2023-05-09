import React, { useState, useEffect } from "react";
import { ThirdwebNftMedia } from "@thirdweb-dev/react";

const ProgressBar = ({ value, max, color }) => {
  const percentage = (value / max) * 100;

  return (
    <div className="w-full h-2 bg-gray-300 rounded mb-1 relative">
      <div
        className={`h-full ${color} rounded`}
        style={{ width: `${percentage}%` }}
      />
      <span className="text-[12px] text-gray-800 font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {value}
      </span>
    </div>
  );
};

const NftItem = ({ metadata, isSelected, onSelect, contract }) => {
  const [charMana, setCharMana] = useState(null);
  const [charStamina, setCharStamina] = useState(null);
  const [charExperience, setCharExperience] = useState(null);
  const [charLevel, setCharLevel] = useState(null);
  const [maxExperience, setMaxExperience] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const mana = await contract.call("getMana", [metadata.id]);
        const stamina = await contract.call("getStamina", [metadata.id]);
        const character = await contract.call("getCharacter", [metadata.id]);
        const experience = character.experience;
        const level = character.level;
        const maxExp = await contract.call("calculateExperienceRequired", [
          level,
        ]);
        setCharMana(mana.toNumber());
        setCharStamina(stamina.toNumber());
        setCharExperience(experience.toNumber());
        setCharLevel(level.toNumber());
        setMaxExperience(maxExp.toNumber());
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [metadata.id, contract]);

  return (
    <div
      className={`border-2 border-gray-400 rounded-lg overflow-hidden hover:border-blue-400 
        ${
          isSelected ? "border-red-400 hover:border-red-400 animate-pulse " : ""
        }`}
      onClick={() => onSelect(isSelected ? null : metadata.id)}
    >
      <div className="relative">
        <ThirdwebNftMedia
          metadata={metadata}
          height={200}
          width={200}
          className="drop-shadow-lg"
        />
        <div className="bottom-0 left-0 mb-2 flex flex-col space-y-1 w-full px-2">
          {charMana !== null && (
            <>
              <div className="text-[12px]">Mana</div>
              <ProgressBar value={charMana} max={100} color="bg-blue-700" />
            </>
          )}
          {charStamina !== null && (
            <>
              <div className="text-[12px]">Stamina</div>
              <ProgressBar value={charStamina} max={100} color="bg-green-700" />
            </>
          )}
          {charExperience !== null &&
            charLevel !== null &&
            maxExperience !== null && (
              <>
                <div className="text-[12px]">Experience</div>
                <ProgressBar
                  value={charExperience}
                  max={maxExperience}
                  color="bg-yellow-500"
                />
              </>
            )}
        </div>
      </div>
    </div>
  );
};

export default NftItem;

import React, { useState, useEffect } from "react";
import { ThirdwebNftMedia } from "@thirdweb-dev/react";

const ProgressBar = ({ value, max, color }) => {
  const percentage = (value / max) * 100;

  return (
    <div className="w-full h-2 bg-gray-300 rounded mb-1">
      <div
        className={`h-2 ${color} rounded flex items-center justify-center`}
        style={{ width: `${percentage}%` }}
      >
        <span className="text-[12px] text-gray-800 font-bold">{value}</span>
      </div>
    </div>
  );
};

const NftItem = ({ metadata, isSelected, onSelect, contract }) => {
  const [charMana, setCharMana] = useState(null);
  const [charStamina, setCharStamina] = useState(null);

  useEffect(() => {
    const fetchMana = async () => {
      try {
        const mana = await contract.call("getMana", [metadata.id]);
        const stamina = await contract.call("getStamina", [metadata.id]);
        setCharMana(mana.toNumber());
        setCharStamina(stamina.toNumber());
      } catch (error) {
        console.error("Error fetching mana:", error);
      }
    };

    fetchMana();
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
        <div className="absolute bottom-0 left-0 mb-2 flex flex-col space-y-1 w-full px-2">
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
        </div>
      </div>
    </div>
  );
};

export default NftItem;

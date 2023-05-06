// EquippedSkill.js
import React from "react";
import { useNFT } from "@thirdweb-dev/react";
import EquippedCharacterCard from "./EquippedCharacterCard";

const EquippedSkill = ({ contract, Id, handleUnequip }) => {
  const { data: nftSkill, isLoading: skillNFTLoading } = useNFT(contract, Id);

  return (
    <EquippedCharacterCard
      itemType="Skill"
      equippedItem={Id}
      loading={skillNFTLoading}
      nftData={nftSkill}
      onUnequip={() => handleUnequip(Id)}
    />
  );
};

export default EquippedSkill;

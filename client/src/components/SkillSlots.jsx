// SkillSlots.js
import React, { useEffect, useState } from "react";
import SkillSlot from "./SkillSlot";
import { useGlobalContext } from "../context";

const SkillSlots = ({ charTWContract, skillTWContract, tokenId }) => {
  const [equippedSkills, setEquippedSkills] = useState([null, null, null]);

  const { characterContract } = useGlobalContext();

  const handleUnequipSkill = async (_skillTokenId) => {
    try {
      const data = await characterContract.unequipSkill(tokenId, _skillTokenId);
      console.info("contract call successs", data);
    } catch (err) {
      console.error("contract call failure", err);
    }
  };

  useEffect(() => {
    if (charTWContract) {
      const fetchEquippedSkills = async () => {
        const fetchedSkills = await charTWContract.getEquippedSkills(tokenId);

        if (fetchedSkills && fetchedSkills.length) {
          const skillsArray = fetchedSkills.map((skillId) => {
            return skillId !== null && skillId !== undefined
              ? skillId.toNumber()
              : null;
          });

          // Fill any missing skills with null to ensure the array has 3 elements
          while (skillsArray.length < 3) {
            skillsArray.push(null);
          }

          setEquippedSkills(skillsArray);
        }
      };

      fetchEquippedSkills();
    }
  }, [charTWContract, tokenId]);

  return (
    <div className="mt-4">
      <p>Equipped Skills</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
        {equippedSkills.map((skillId, index) => (
          <SkillSlot
            key={index}
            index={index}
            skillId={skillId}
            contract={skillTWContract}
            handleUnequip={handleUnequipSkill}
          />
        ))}
      </div>
    </div>
  );
};

export default SkillSlots;

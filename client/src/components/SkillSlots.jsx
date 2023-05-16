import React, { useEffect } from "react";
import SkillSlot from "./SkillSlot";
import { useGlobalContext } from "../context";

const SkillSlots = ({ charTWContract, skillTWContract, tokenId }) => {
  const {
    characterContract,
    equippedSkills,
    setEquippedSkills,
    equippedSkillLoading,
    setEquippedSkillLoading,
    setLocalOwnedSkills,
  } = useGlobalContext();

  const handleUnequipSkill = async (_skillTokenId) => {
    setEquippedSkillLoading(true);
    try {
      const unEquiptx = await characterContract.unequipSkill(
        tokenId,
        _skillTokenId
      );
      await unEquiptx.wait();

      setEquippedSkills((prevSkills) => {
        // Step 1: Replace the unequipped skill with null
        const newSkills = prevSkills.map((skillId) =>
          skillId === _skillTokenId ? null : skillId
        );

        // Step 2: Rearrange the array to move null values to the end
        const skillsWithValues = newSkills.filter(
          (skillId) => skillId !== null
        );
        const nullSkills = newSkills.filter((skillId) => skillId === null);
        return [...skillsWithValues, ...nullSkills];
      });

      // Step 3: Add the unequipped skill back to the globalOwnedSkills
      const skillToBeAddedBack = equippedSkills.find(
        (skill) => skill.metadata.id === _skillTokenId
      );
      setLocalOwnedSkills((prevSkills) => [...prevSkills, skillToBeAddedBack]);

      setEquippedSkillLoading(false);
    } catch (err) {
      console.error("contract call failure", err);
    }
  };

  useEffect(() => {
    const fetchEquippedSkills = async () => {
      const fetchedSkills = await charTWContract.call("getEquippedSkills", [
        tokenId,
      ]);

      if (fetchedSkills) {
        const skillsArray = new Array(3).fill(null);

        fetchedSkills.forEach((skillId, index) => {
          skillsArray[index] =
            skillId !== null && skillId !== undefined
              ? skillId.toNumber()
              : null;
        });

        setEquippedSkills(skillsArray);
      }
    };

    if (
      !equippedSkillLoading &&
      equippedSkills.every((skillId) => skillId === null)
    ) {
      fetchEquippedSkills();
    }
  }, [
    charTWContract,
    tokenId,
    equippedSkills,
    setEquippedSkills,
    equippedSkillLoading,
  ]);

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

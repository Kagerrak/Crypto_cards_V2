import React, { useEffect } from "react";
import SkillSlot from "./SkillSlot";
import { useGlobalContext } from "../context";

const SkillSlots = ({
  charTWContract,
  skillTWContract,
  compositeTWContract,
  tokenId,
}) => {
  const {
    characterContract,
    equippedSkills,
    setEquippedSkills,
    equippedSkillLoading,
    setEquippedSkillLoading,
    allOwnedSkills,
    localOwnedSkills,
    setLocalOwnedSkills,
    equipManagementContract,
  } = useGlobalContext();

  const handleUnequipSkill = async (_skillTokenId) => {
    setEquippedSkillLoading(true);
    try {
      const unequipTx = await equipManagementContract.unequip(
        tokenId,
        _skillTokenId,
        _skillTokenId > 10000 ? 4 : 1
      );
      await unequipTx.wait();

      setEquippedSkills((prevSkills) => {
        const newSkills = prevSkills.map((skillId) =>
          skillId === _skillTokenId ? null : skillId
        );
        const skillsWithValues = newSkills.filter(
          (skillId) => skillId !== null
        );
        const nullSkills = newSkills.filter((skillId) => skillId === null);
        return [...skillsWithValues, ...nullSkills];
      });

      const unequippedSkill = allOwnedSkills.find(
        (skill) => skill.metadata.id === _skillTokenId
      );
      if (unequippedSkill) {
        setLocalOwnedSkills((prevSkills) => [...prevSkills, unequippedSkill]);
      }

      setEquippedSkillLoading(false);
    } catch (err) {
      console.error("contract call failure", err);
    }
  };

  useEffect(() => {
    const fetchEquippedSkills = async () => {
      if (!charTWContract || !tokenId) {
        return;
      }

      try {
        const fetchedSkills = await charTWContract.call(
          "getCharacterEquippedSkills",
          [tokenId]
        );

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
      } catch (error) {
        console.error("Error fetching skills:", error);
      }
    };

    if (
      charTWContract &&
      tokenId &&
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
            contractComposite={compositeTWContract}
            handleUnequip={handleUnequipSkill}
          />
        ))}
      </div>
    </div>
  );
};

export default SkillSlots;

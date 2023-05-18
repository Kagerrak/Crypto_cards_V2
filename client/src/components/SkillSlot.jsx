// SkillSlot.js
import React, { useEffect } from "react";
import { useNFT, ThirdwebNftMedia } from "@thirdweb-dev/react";
import { useGlobalContext } from "../context";

const SkillSlot = ({ index, skillId, contract, handleUnequip }) => {
  const { setAllOwnedSkills } = useGlobalContext();

  // Always call the useNFT hook.
  const nftQuery = useNFT(contract, skillId);

  // Then, conditionally handle the data based on skillId.
  const { data: nftSkill, isLoading: skillNFTLoading } =
    skillId != null ? nftQuery : { data: null, isLoading: false };

  useEffect(() => {
    if (nftSkill) {
      console.log("nftSkill", nftSkill);
      setAllOwnedSkills((prevSkills) => {
        const skillExists = prevSkills.some(
          (skill) => skill.metadata.id === nftSkill.metadata.id
        );
        if (!skillExists) {
          return [...prevSkills, nftSkill];
        }
        return prevSkills;
      });
    }
  }, [nftSkill, setAllOwnedSkills]);

  return (
    <div className="bg-gray-200 w-14 h-14 flex items-center justify-center text-center text-[15px] text-gray-700 font-bold rounded-md mb-2">
      {skillNFTLoading || !nftSkill ? (
        `Skill ${index + 1}`
      ) : (
        <div
          className="relative"
          onMouseEnter={(e) => {
            e.currentTarget
              .querySelector(".hover-button")
              .classList.remove("hidden");
          }}
          onMouseLeave={(e) => {
            e.currentTarget
              .querySelector(".hover-button")
              .classList.add("hidden");
          }}
        >
          <ThirdwebNftMedia
            metadata={nftSkill.metadata}
            width={80}
            height={80}
            className="rounded-xl"
          />
          <button
            className="hidden absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-400 bg-opacity-5 text-white px-3 py-2 rounded-md z-10 hover-button text-xs"
            onClick={() => handleUnequip(skillId)}
          >
            Unequip
          </button>
        </div>
      )}
    </div>
  );
};

export default SkillSlot;

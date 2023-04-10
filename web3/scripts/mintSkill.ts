import { ethers } from "hardhat";

async function mintSkill() {
  const accounts = await ethers.getSigners();
  const owner = accounts[0];
  const approvedOperator = accounts[1];

  // Get the deployed BattleSkills contract address
  const battleSkillsAddress = "0x2722aF94Ab9051A9C781109e10F26FB3b02168EE"; // Replace with the actual deployed address

  // Get an instance of the BattleSkills contract
  const BattleSkills = await ethers.getContractFactory("BattleSkills");
  const battleSkills = await BattleSkills.attach(battleSkillsAddress);

  // Create a new skill
  const skillName = "earth";
  const damage = 10;
  const manaCost = 10;
  const statusEffects = [];
  const tokenURI = "https://example.com/earth.json";
  await battleSkills.createSkill(
    skillName,
    damage,
    manaCost,
    statusEffects,
    tokenURI
  );
  console.log(
    `Skill "${skillName}" created with damage ${damage} and mana cost ${manaCost}`
  );

  // Mint a skill for owner account
  const skillIdForOwner = 0;
  await battleSkills.mintSkill(skillIdForOwner, owner.getAddress());
  console.log(`Minted skill with ID ${skillIdForOwner} for owner account`);

  // Mint a skill for approved operator account
  const skillIdForApprovedOperator = 1;
  const battleSkillsWithApprovedOperator =
    battleSkills.connect(approvedOperator);
  await battleSkillsWithApprovedOperator.mintSkill(
    skillIdForApprovedOperator,
    approvedOperator.getAddress()
  );
  console.log(
    `Minted skill with ID ${skillIdForApprovedOperator} for approved operator account`
  );
}

mintSkill()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

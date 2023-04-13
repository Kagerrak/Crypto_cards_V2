import { ethers } from "hardhat";

async function mintSkill() {
  const accounts = await ethers.getSigners();
  const owner = accounts[0];
  const approvedOperator = accounts[1];

  // Get the deployed BattleSkills and Character contract addresses
  const battleSkillsAddress = "0x883dDBd4dD4e8c0FBE78E6c268CFa7Bdc7a9b526";
  const characterContractAddress = "0x03f954B6B45BAad6720B87e7b5Ee962e99C1EEa9";

  // Get instances of the BattleSkills and Character contracts
  const BattleSkills = await ethers.getContractFactory("BattleSkills");
  const battleSkills = await BattleSkills.attach(battleSkillsAddress);

  const Character = await ethers.getContractFactory("Character");
  const character = await Character.attach(characterContractAddress);

  // Create a new skill
  const skillName = "earth";
  const damage = 45;
  const manaCost = 60;
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

  // Equip the skill for owner account
  const characterTokenIdForOwner = 0; // Replace with the actual character token ID
  const characterWithOwner = character.connect(owner);
  await characterWithOwner.equipSkill(
    characterTokenIdForOwner,
    skillIdForOwner
  );
  console.log(
    `Equipped skill with ID ${skillIdForOwner} for owner account's character with token ID ${characterTokenIdForOwner}`
  );

  // Equip the skill for approved operator account
  const characterTokenIdForApprovedOperator = 1; // Replace with the actual character token ID
  const characterWithApprovedOperator = character.connect(approvedOperator);
  await characterWithApprovedOperator.equipSkill(
    characterTokenIdForApprovedOperator,
    skillIdForApprovedOperator
  );
  console.log(
    `Equipped skill with ID ${skillIdForApprovedOperator} for approved operator account's character with token ID ${characterTokenIdForApprovedOperator}`
  );
}

mintSkill()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

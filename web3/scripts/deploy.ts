import { ethers } from "hardhat";
import copyContracts from "./copy-contracts";

async function deploy(name: string, ...params: [string]) {
  const contractFactory = await ethers.getContractFactory(name);

  return await contractFactory.deploy(...params).then((f) => f.deployed());
}

async function main() {
  const [admin] = await ethers.getSigners();

  console.log(`Deploying smart contracts...`);

  // Deploy BattleSkills contract
  const BattleSkills = await ethers.getContractFactory("BattleSkills");
  const battleSkills = await BattleSkills.deploy();
  await battleSkills.deployed();
  console.log("BattleSkills deployed to:", battleSkills.address);

  // Deploy BattleItems contract
  const BattleItems = await ethers.getContractFactory("BattleItems");
  const battleItems = await BattleItems.deploy();
  await battleItems.deployed();
  console.log("BattleItems deployed to:", battleItems.address);

  // Deploy Character contract
  const Character = await ethers.getContractFactory("Character");
  const character = await Character.deploy();
  await character.deployed();
  console.log("Character deployed to:", character.address);

  // Deploy Battle contract with Character and BattleSkills addresses as arguments
  const Battle = await ethers.getContractFactory("Battle");
  const battle = await Battle.deploy(character.address, battleSkills.address);
  await battle.deployed();
  console.log("Battle deployed to:", battle.address);

  // Set the BattleSkills contract address in the Character contract
  await character.setBattleSkills(battleSkills.address);

  // Set the BattleItems contract address in the Character contract
  await character.setBattleItems(battleItems.address);

  // Create a new skill
  const skillName = "fire";
  const damage = 10;
  const manaCost = 30;
  const statusEffects = [];
  const tokenURI = "https://example.com/fire.json";
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

  // Set approval for the character contract address for two accounts
  const accounts = await ethers.getSigners();
  const owner = accounts[0];
  const approvedOperator = accounts[1];
  const unapprovedOperator = accounts[2];

  // Connect to BattleSkills contract with owner account
  const battleSkillsWithOwner = battleSkills.connect(owner);

  // Approve character contract address for owner account
  await battleSkillsWithOwner.setApprovalForAll(character.address, true);
  console.log("Approved character contract address for owner account");

  // Connect to BattleSkills contract with approved operator account
  const battleSkillsWithApprovedOperator =
    battleSkills.connect(approvedOperator);

  // Approve character contract address for approved operator account
  await battleSkillsWithApprovedOperator.setApprovalForAll(
    character.address,
    true
  );
  console.log(
    "Approved character contract address for approved operator account"
  );

  // Mint a character with typeId 0 and skillID 0 for owner account
  await character.mintNewCharacterWithItemAndEquip(0, 0);
  console.log("Minted character with typeId 0 and skillID 0 for owner account");

  // Mint a character with typeId 1 and skillID 0 for approved operator account
  const characterWithApprovedOperator = character.connect(approvedOperator);
  await characterWithApprovedOperator.mintNewCharacterWithItemAndEquip(1, 0);
  console.log(
    "Minted character with typeId 1 and skillID 0 for approved operator account"
  );

  // Copy contract artifacts to client directory
  await copyContracts(
    battle.address,
    character.address,
    battleSkills.address,
    battleItems.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

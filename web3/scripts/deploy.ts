import { ethers } from "hardhat";
import copyContracts from "./copy-contracts";
import { verify } from "./verify";

async function deploy(name: string, ...params: [string]) {
  const contractFactory = await ethers.getContractFactory(name);
  return await contractFactory.deploy(...params).then((f) => f.deployed());
}

async function main() {
  const [admin] = await ethers.getSigners();

  console.log(`Deploying smart contracts...`);

  // Deploy StatCalculation library
  const StatCalculation = await ethers.getContractFactory("StatCalculation");
  const statCalculation = await StatCalculation.deploy();
  await statCalculation.deployed();
  console.log("StatCalculation deployed to:", statCalculation.address);

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

  // Deploy Character contract with StatCalculation library address
  const Character = await ethers.getContractFactory("Character", {
    libraries: {
      StatCalculation: statCalculation.address,
    },
  });
  const character = await Character.deploy();
  await character.deployed();
  console.log("Character deployed to:", character.address);

  // Deploy Battle contract with BattleResolutionLibrary and StatusEffectsLibrary addresses
  const Battle = await ethers.getContractFactory("Battle");
  const battle = await Battle.deploy(character.address, battleSkills.address);
  await battle.deployed();
  console.log("Battle deployed to:", battle.address);

  // Set the BattleSkills contract address in the Character contract
  await character.setBattleSkills(battleSkills.address);

  // Set the BattleItems contract address in the Character contract
  await character.setBattleItems(battleItems.address);

  // Set the Battle contract address in the Character contract
  await character.setBattleContract(battle.address);

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

  // Copy contract artifacts to client directory
  await copyContracts(
    battle.address,
    character.address,
    battleSkills.address,
    battleItems.address
  );

  await verify(character.address, []);
  await verify(battleSkills.address, []);
  await verify(battleItems.address, []);
  await verify(battle.address, [character.address, battleSkills.address]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

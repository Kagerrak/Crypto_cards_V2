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
  const CMLib = await ethers.getContractFactory("CMLib");
  const cmLib = await CMLib.deploy();
  await cmLib.deployed();
  console.log("CMLib deployed to:", cmLib.address);

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

  // Deploy BattleEffects contract
  const BattleEffects = await ethers.getContractFactory("BattleEffects");
  const battleEffects = await BattleEffects.deploy();
  await battleEffects.deployed();
  console.log("BattleEffects deployed to:", battleEffects.address);

  // Deploy CompositeTokens contract
  const CompositeTokens = await ethers.getContractFactory("CompositeTokens");
  const compositeTokens = await CompositeTokens.deploy(
    battleSkills.address,
    battleItems.address,
    battleEffects.address
  );
  await compositeTokens.deployed();
  console.log("CompositeTokens deployed to:", compositeTokens.address);

  // Deploy Character contract with StatCalculation library address
  const Character = await ethers.getContractFactory("Character", {
    libraries: {
      CMLib: cmLib.address,
    },
  });
  const character = await Character.deploy();
  await character.deployed();
  console.log("Character deployed to:", character.address);

  // Initialize 3 character stats
  // await character.createCharacterStats(
  //   1,
  //   0,
  //   100,
  //   100,
  //   10,
  //   100,
  //   100,
  //   100,
  //   100,
  //   100,
  //   100,
  //   5
  // );
  // await character.createCharacterStats(
  //   1,
  //   0,
  //   100,
  //   100,
  //   10,
  //   100,
  //   100,
  //   100,
  //   100,
  //   100,
  //   100,
  //   5
  // );
  // await character.createCharacterStats(
  //   1,
  //   0,
  //   100,
  //   100,
  //   100,
  //   100,
  //   100,
  //   100,
  //   100,
  //   100,
  //   100,
  //   5
  // );

  // // Initialize 3 character types
  // await character.createCharacterType(
  //   "Warrior",
  //   "ipfs://QmZzBmjrjn742Dx8wPHheq8XbzkowWS6xqvLHURTSvLQCo"
  // );
  // await character.createCharacterType(
  //   "Mage",
  //   "ipfs://QmTYEiXiTzBhYuwuQ7bjS5aqChrefEJZ37as8BDrKYxk1j"
  // );
  // await character.createCharacterType(
  //   "Rogue",
  //   "ipfs://QmUyWmpry8Sri9BmsHSQMDBPtnPZkoX6GS7w8ZizpnFX7v"
  // );

  // Deploy Battle contract
  // Re-deploy Battle contract with new constructor arguments
  const Battle = await ethers.getContractFactory("Battle");
  const battle = await Battle.deploy(
    character.address,
    battleSkills.address,
    battleEffects.address,
    compositeTokens.address
  );
  await battle.deployed();
  console.log("Battle deployed to:", battle.address);

  // Deploy EquipManagement contract
  const EquipManagement = await ethers.getContractFactory("EquipManagement");
  const equipManagement = await EquipManagement.deploy(
    battleItems.address,
    battleSkills.address,
    compositeTokens.address
  );
  await equipManagement.deployed();
  console.log("EquipManagement deployed to:", equipManagement.address);

  // Set the Character contract address in the EquipManagement contract
  await equipManagement.setCharacterContract(character.address);
  console.log(
    "Character contract address set in EquipManagement contract:",
    character.address
  );

  // Set the BattleSkills contract address in the Character contract
  await character.setBattleSkills(battleSkills.address);
  console.log(
    "BattleSkills contract address set in Character contract:",
    battleSkills.address
  );

  // Set the BattleItems contract address in the Character contract
  await character.setBattleItems(battleItems.address);
  console.log(
    "BattleItems contract address set in Character contract:",
    battleItems.address
  );

  // Set the CompositeTokens contract address in the Character contract
  await character.setCompositeTokens(compositeTokens.address);
  console.log(
    "CompositeTokens contract address set in Character contract:",
    battleItems.address
  );

  // Set the Battle contract address in the Character contract
  await character.setBattleContract(battle.address);
  console.log(
    "Battle contract address set in Character contract:",
    battle.address
  );

  // Set the EquipManagement contract address in the Character contract
  await character.setEquipManagementContract(equipManagement.address);
  console.log(
    "EquipManagement contract address set in Character contract:",
    equipManagement.address
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

  const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // You might need to provide the appropriate EntryPoint address here.
  const DappAccountFactory = await ethers.getContractFactory(
    "DappAccountFactory"
  );
  const dappAccountFactory = await DappAccountFactory.deploy(entryPointAddress);
  await dappAccountFactory.deployed();
  console.log("DappAccountFactory deployed to:", dappAccountFactory.address);

  // Copy contract artifacts to client directory
  await copyContracts(
    battle.address,
    character.address,
    battleSkills.address,
    battleItems.address,
    battleEffects.address,
    compositeTokens.address,
    equipManagement.address,
    dappAccountFactory.address
  );

  await verify(character.address, []);
  await verify(battleSkills.address, []);
  await verify(battleItems.address, []);
  await verify(battleEffects.address, []);
  await verify(compositeTokens.address, [
    battleSkills.address,
    battleItems.address,
    battleEffects.address,
  ]);
  await verify(battle.address, [
    character.address,
    battleSkills.address,
    battleEffects.address,
    compositeTokens.address,
  ]);
  await verify(equipManagement.address, [
    battleItems.address,
    battleSkills.address,
    compositeTokens.address,
  ]);
  await verify(dappAccountFactory.address, [entryPointAddress]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import fs from "fs";
import path from "path";

async function copyContracts(
  battleAddress: string,
  characterAddress: string,
  battleSkillsAddress: string,
  battleItemsAddress: string,
  battleEffectsAddress: string,
  compositeTokensAddress: string,
  equipManagementAddress: string,
  dappAccountFactoryAddress: string
) {
  const outputDir = path.join(
    __dirname,
    "..",
    "..",
    "client",
    "src",
    "contract"
  );
  fs.mkdirSync(outputDir, { recursive: true });

  // Paths for artifacts
  const artifactPaths = {
    Battle: path.join(
      __dirname,
      "..",
      "artifacts",
      "contracts",
      "Battle.sol",
      "Battle.json"
    ),
    BattleItems: path.join(
      __dirname,
      "..",
      "artifacts",
      "contracts",
      "BattleItems.sol",
      "BattleItems.json"
    ),
    BattleSkills: path.join(
      __dirname,
      "..",
      "artifacts",
      "contracts",
      "BattleSkills.sol",
      "BattleSkills.json"
    ),
    Character: path.join(
      __dirname,
      "..",
      "artifacts",
      "contracts",
      "Character.sol",
      "Character.json"
    ),
    BattleEffects: path.join(
      __dirname,
      "..",
      "artifacts",
      "contracts",
      "BattleEffects.sol",
      "BattleEffects.json"
    ),
    CompositeTokens: path.join(
      __dirname,
      "..",
      "artifacts",
      "contracts",
      "CompositeTokens.sol",
      "CompositeTokens.json"
    ),
    EquipManagement: path.join(
      __dirname,
      "..",
      "artifacts",
      "contracts",
      "EquipManagement.sol",
      "EquipManagement.json"
    ),
    DappAccountFactory: path.join(
      __dirname,
      "..",
      "artifacts",
      "contracts",
      "DappAccountFactory.sol",
      "DappAccountFactory.json"
    ),
  };

  // Output paths
  const outputPaths = {
    Battle: path.join(outputDir, "battleContract.json"),
    BattleItems: path.join(outputDir, "battleItems.json"),
    BattleSkills: path.join(outputDir, "battleSkills.json"),
    Character: path.join(outputDir, "characterContract.json"),
    BattleEffects: path.join(outputDir, "battleEffects.json"),
    CompositeTokens: path.join(outputDir, "compositeTokens.json"),
    EquipManagement: path.join(outputDir, "equipManagement.json"),
    DappAccountFactory: path.join(outputDir, "dappAccountFactory.json"),
  };

  // Copy artifact files
  for (const contract in artifactPaths) {
    fs.copyFileSync(artifactPaths[contract], outputPaths[contract]);
    console.log(
      `Copied ${contract} contract data to ${outputPaths[contract]}!`
    );
  }

  const outputPathIndex = path.join(outputDir, "index.js");
  const indexFileContent = `
    import characterContract from "./characterContract.json";
    import battleSkills from "./battleSkills.json";
    import battleItems from "./battleItems.json";
    import battleContract from "./battleContract.json";
    import battleEffects from "./battleEffects.json";
    import compositeTokens from "./compositeTokens.json";
    import equipManagement from "./equipManagement.json";
    import dappAccountFactory from "./dappAccountFactory.json";
    
    export const characterContractAddress = "${characterAddress}";
    export const characterContractABI = characterContract.abi;
    
    export const battleSkillsAddress = "${battleSkillsAddress}";
    export const battleSkillsABI = battleSkills.abi;
    
    export const battleItemsAddress = "${battleItemsAddress}";
    export const battleItemsABI = battleItems.abi;
    
    export const battleContractAddress = "${battleAddress}";
    export const battleContractABI = battleContract.abi;
    
    export const battleEffectsAddress = "${battleEffectsAddress}";
    export const battleEffectsABI = battleEffects.abi;
    
    export const compositeTokensAddress = "${compositeTokensAddress}";
    export const compositeTokensABI = compositeTokens.abi;

    export const equipManagementAddress = "${equipManagementAddress}";
    export const equipManagementABI = equipManagement.abi;

    export const dappAccountFactoryAddress = "${dappAccountFactoryAddress}";
    export const dappAccountFactoryABI = dappAccountFactory.abi;
  `;

  fs.writeFileSync(outputPathIndex, indexFileContent);
  console.log(`Wrote contract addresses to ${outputPathIndex}!`);
}

export default copyContracts;

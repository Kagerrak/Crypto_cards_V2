import fs from "fs";
import path from "path";

async function copyContracts(
  battleAddress: string,
  characterAddress: string,
  battleSkillsAddress: string,
  battleItemsAddress: string
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

  const artifactPathBattle = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "Battle.sol",
    "Battle.json"
  );
  const artifactPathBattleItems = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "BattleItems.sol",
    "BattleItems.json"
  );
  const artifactPathBattleSkills = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "BattleSkills.sol",
    "BattleSkills.json"
  );
  const artifactPathCharacter = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "Character.sol",
    "Character.json"
  );

  const outputPathBattle = path.join(outputDir, "battleContract.json");
  const outputPathBattleItems = path.join(outputDir, "battleItems.json");
  const outputPathBattleSkills = path.join(outputDir, "battleSkills.json");
  const outputPathCharacter = path.join(outputDir, "characterContract.json");
  const outputPathIndex = path.join(outputDir, "index.js");

  fs.copyFileSync(artifactPathBattle, outputPathBattle);
  console.log(`Copied Battle contract data to ${outputPathBattle}!`);

  fs.copyFileSync(artifactPathBattleItems, outputPathBattleItems);
  console.log(`Copied BattleItems contract data to ${outputPathBattleItems}!`);

  fs.copyFileSync(artifactPathBattleSkills, outputPathBattleSkills);
  console.log(
    `Copied BattleSkills contract data to ${outputPathBattleSkills}!`
  );

  fs.copyFileSync(artifactPathCharacter, outputPathCharacter);
  console.log(`Copied Character contract data to ${outputPathCharacter}!`);

  const indexFileContent = `
  import characterContract from "./characterContract.json";
  import battleSkills from "./battleSkills.json";
  import battleItems from "./battleItems.json";
  import battleContract from "./battleContract.json";
  
  export const characterContractAddress = "${characterAddress}";
  export const characterContractABI = characterContract.abi;
  
  export const battleSkillsAddress = "${battleSkillsAddress}";
  export const battleSkillsABI = battleSkills.abi;
  
  export const battleItemsAddress = "${battleItemsAddress}";
  export const battleItemsABI = battleItems.abi;
  
  export const battleContractAddress = "${battleAddress}";
  export const battleContractABI = battleContract.abi;
  `;

  fs.writeFileSync(outputPathIndex, indexFileContent);
  console.log(`Wrote contract addresses to ${outputPathIndex}!`);
}

export default copyContracts;

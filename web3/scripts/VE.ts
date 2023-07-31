import { ethers } from "hardhat";
import { verify } from "./verify";

async function main() {
  // Retrieve contract addresses from environment variables, a config file, or any other source
  const equipManagementAddress = "0xAAE0A9d6122eeFa31c09B28F97ee4E1E524E4B4B";
  const battleItemsAddress = "0x27dc61d2474a4b9C25a91940Cbc20dAEddE99128";
  const battleSkillsAddress = "0x9053fd2951a807395Fd361167eE740F45E114162";
  const compositeTokensAddress = "0x8B28B10D1B960985735F9cf5b0f4C86F4e0d3A11";

  await verify(equipManagementAddress, [
    battleItemsAddress,
    battleSkillsAddress,
    compositeTokensAddress,
  ]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

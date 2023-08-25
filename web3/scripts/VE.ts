import { ethers } from "hardhat";
import { verify } from "./verify";

async function main() {
  const characterContractAddress = "0xF5A7A31e39a641316d9D4C2b46051fAe97A757cb";

  const battleSkillsAddress = "0xd8e22aAa4BB6f24e23Ed54Ec7edA9b66417D0f65";

  const battleItemsAddress = "0x0B5eA1b041921274672953479B472588DEaFbae2";

  const battleContractAddress = "0xe6179514774DB9541799126FCe06A384dDAA814C";

  const battleEffectsAddress = "0x86c22C764a4fe46Ca23D454e951b35356b907F93";

  const compositeTokensAddress = "0xa008e3C9db0eceE0fc5C2d0D13Ab9540449B17d5";

  const equipManagementAddress = "0x8A6119299a97EafF698245D9d6A4008f5F7Dd46C";

  const dappAccountFactoryAddress =
    "0x0790dD589BbC9405221C3606B8c2dc69cbf76Bf7";

  // await verify(characterContractAddress, []);
  // await verify(battleSkillsAddress, []);
  // await verify(battleItemsAddress, []);
  // await verify(battleEffectsAddress, []);
  // await verify(compositeTokensAddress, [
  //   battleSkillsAddress,
  //   battleItemsAddress,
  //   battleEffectsAddress,
  // ]);
  // await verify(battleContractAddress, [
  //   characterContractAddress,
  //   battleSkillsAddress,
  //   battleEffectsAddress,
  //   compositeTokensAddress,
  // ]);

  await verify("0xAF3CaE8E40b6ddD36018dB4213feb5Cd11Ef8297", [
    "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    dappAccountFactoryAddress,
  ]);

  // await verify(equipManagementAddress, [
  //   battleItemsAddress,
  //   battleSkillsAddress,
  //   compositeTokensAddress,
  // ]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

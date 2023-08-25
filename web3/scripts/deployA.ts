import { ethers } from "hardhat";
import { verify } from "./verify";

async function main() {
  //   const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // You might need to provide the appropriate EntryPoint address here.
  //   const DappAccountFactory = await ethers.getContractFactory(
  //     "DappAccountFactory"
  //   );
  //   const dappAccountFactory = await DappAccountFactory.deploy(entryPointAddress);
  //   await dappAccountFactory.deployed();
  //   console.log("DappAccountFactory deployed to:", dappAccountFactory.address);

  const BattleSkills = await ethers.getContractFactory("BattleSkills");
  const battleSkills = await BattleSkills.deploy();
  await battleSkills.deployed();

  console.log("BattleSkills deployed to:", battleSkills.address);

  await verify(battleSkills.address, []);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

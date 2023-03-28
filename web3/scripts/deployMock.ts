import { ethers } from "hardhat";
import console from "console";

const DECIMALS = 8;
const INITIAL_ANSWER = 155700000000;

const args = [DECIMALS, INITIAL_ANSWER];

async function deploy(name: string, params: number[]) {
  const contractFactory = await ethers.getContractFactory(name);

  return await contractFactory.deploy(...params).then((f) => f.deployed());
}

async function main() {
  const [admin] = await ethers.getSigners();

  console.log(`Deploying a smart contract...`);

  const MockV3Aggregator = (await deploy("MockV3Aggregator", args)).connect(
    admin
  );

  console.log({ MockV3Aggregator: MockV3Aggregator.address });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

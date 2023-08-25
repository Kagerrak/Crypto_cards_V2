import { run } from "hardhat";

const verify = async (contractAddress: string, args: any[]) => {
  console.log(`Verifying contract... ${contractAddress}`);
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "message" in e) {
      if ((e as Error).message.toLowerCase().includes("already verified")) {
        console.log("Already verified!");
      } else {
        console.log((e as Error).message);
      }
    }
  }
};

export { verify };

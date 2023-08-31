import { ethers } from "hardhat";
import { verify } from "./verify";

async function main() {
  // Retrieve contract addresses from environment variables, a config file, or any other source
   const characterContractAddress =
  "0x928e6e1cF1192e14a150334D878D08cc749bf086";


 const battleSkillsAddress = "0xa2c032394Fc4b759bA320d63dF37F2180ee55e75";


 const battleItemsAddress = "0xa22152070E811adcBe72487FE66528E40B353832";


 const battleContractAddress =
  "0x9d3f98830B1B09Ff4fAF782705d8ccD241B7862D";

 const battleHelperAddress = "0xAD74A8193a0030B6f670bB6C40F2a01541F21A07";


 const battleEffectsAddress =
  "0x0F854D217c3100042236b3Ef6E981aA60Ef8baF0";


 const compositeTokensAddress =
  "0xf5A34576Cb525b3eED1e94de9BB81D1B7834627d";


 const equipManagementAddress =
  "0x309037140dF6Cee7Bf251580a7Cd24560EAd04D2";


  await verify(characterContractAddress, []);
  await verify(battleSkillsAddress, []);
  await verify(battleItemsAddress, []);
  await verify(battleEffectsAddress, []);
  await verify(compositeTokensAddress, [
    battleSkillsAddress,
    battleItemsAddress,
    battleEffectsAddress,
  ]);
  await verify(battleContractAddress, [characterContractAddress]);
  await verify(battleHelperAddress, [characterContractAddress,
    battleSkillsAddress,
    battleEffectsAddress,
    compositeTokensAddress]);
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

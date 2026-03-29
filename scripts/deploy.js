import { ethers } from "hardhat";

async function main() {
  console.log("Deploying MedicalRecords contract...");

  const MedicalRecords = await ethers.getContractFactory("MedicalRecords");
  const medicalRecords = await MedicalRecords.deploy();

  await medicalRecords.waitForDeployment();

  const address = await medicalRecords.getAddress();
  console.log("MedicalRecords deployed to:", address);

  // Save deployment info
  const fs = await import('fs');
  const contractConfig = {
    contractAddress: address,
    network: "localhost",
    chainId: 31337,
    deployedAt: new Date().toISOString(),
    abi: medicalRecords.interface.format('json')
  };

  fs.writeFileSync('./backend/contractConfig.json', JSON.stringify(contractConfig, null, 2));
  fs.writeFileSync('./frontend/src/contractConfig.json', JSON.stringify(contractConfig, null, 2));

  console.log("✅ Contract deployed and config files updated!");
  console.log("📋 Address:", address);
  console.log("🌐 Network: localhost | Chain ID:", 31337);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
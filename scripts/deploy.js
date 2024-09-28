const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const AdvancedToken = await hre.ethers.getContractFactory("AdvancedToken");
  const advancedToken = await AdvancedToken.deploy("AdvancedToken", "ADV");

  await advancedToken.deployed();

  console.log("AdvancedToken deployed to:", advancedToken.address);

  // Verify the contract on Etherscan
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await advancedToken.deployTransaction.wait(6);
    await hre.run("verify:verify", {
      address: advancedToken.address,
      constructorArguments: ["AdvancedToken", "ADV"],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
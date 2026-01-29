import { ethers, upgrades } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying TrustScoreOracle with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Default query fee: 0.001 ETH
  const queryFee = ethers.parseEther("0.001");

  // Deploy as UUPS proxy
  const TrustScoreOracle = await ethers.getContractFactory("TrustScoreOracle");
  const oracle = await upgrades.deployProxy(
    TrustScoreOracle,
    [deployer.address, queryFee],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await oracle.waitForDeployment();

  const proxyAddress = await oracle.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("\n=== Deployment Complete ===");
  console.log("Proxy address:", proxyAddress);
  console.log("Implementation address:", implementationAddress);
  console.log("Owner:", deployer.address);
  console.log("Query fee:", ethers.formatEther(queryFee), "ETH");

  console.log("\nAdd to .env:");
  console.log(`ORACLE_CONTRACT=${proxyAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

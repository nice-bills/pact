import hre from "hardhat";

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  console.log("Deploying AgenticCommerce (ERC-8183)...");
  console.log("Deployer:", deployer.account.address);

  // Use USDC on Base Sepolia
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const treasury = deployer.account.address; // deployer as treasury for demo
  const feeBP = 0n; // 0% platform fee for mutual aid

  const agenticCommerce = await hre.viem.deployContract("AgenticCommerce", [
    usdcAddress,
    treasury,
    feeBP,
  ]);

  console.log("AgenticCommerce deployed at:", agenticCommerce.address);
  console.log("Payment token (USDC):", usdcAddress);
  console.log("Platform fee: 0%");
  console.log("");
  console.log("Add to your .env:");
  console.log(`AGENTIC_COMMERCE_ADDRESS=${agenticCommerce.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

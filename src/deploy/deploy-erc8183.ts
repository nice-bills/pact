import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const RPC_URL = process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("DEPLOYER_PRIVATE_KEY not set");
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http(RPC_URL) });

  console.log("Deploying AgenticCommerce (ERC-8183)...");
  console.log("Deployer:", account.address);
  console.log("Payment token (USDC):", USDC_ADDRESS);
  console.log("\nUse hardhat to deploy:");
  console.log("  npx hardhat run scripts/deploy-agentic-commerce.ts");
  console.log("\nThen add AGENTIC_COMMERCE_ADDRESS to your .env");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

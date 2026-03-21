import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const RPC_URL = process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("DEPLOYER_PRIVATE_KEY not set");
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL),
  });
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(RPC_URL),
  });

  console.log("Wallet:", account.address);
  console.log("Requesting USDC from faucet...");
  console.log("(Note: Base Sepolia USDC faucets are limited. Use a bridge or exchange.)");
  console.log("\nTo get test USDC:");
  console.log("1. Bridge ETH to Base Sepolia");
  console.log("2. Use Circle's faucet: https://www.circle.com/en/usdc");
  console.log("3. Or check: https://bridge.base.org");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

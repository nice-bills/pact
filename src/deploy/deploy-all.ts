import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CHAIN, RPC_URL, USDC_ADDRESS } from "../core/config.js";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("DEPLOYER_PRIVATE_KEY not set");
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });
  const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) });

  console.log("=== Mutual Aid Pool Full Deployment ===\n");
  console.log(`Chain: ${CHAIN.name} (${CHAIN.id})`);
  console.log(`USDC: ${USDC_ADDRESS}`);
  console.log("Deployer:", account.address);

  const envPath = path.join(process.cwd(), ".env");
  const updates: Record<string, string> = {
    AGENTIC_COMMERCE_ADDRESS: process.env.AGENTIC_COMMERCE_ADDRESS ?? "TODO",
    POOL_SAFE_ADDRESS: process.env.POOL_SAFE_ADDRESS ?? "TODO",
    CHAIN_NAME: process.env.CHAIN_NAME ?? "base-sepolia",
  };

  console.log("\n[1/3] AgenticCommerce (ERC-8183)");
  console.log("  Run: npm run deploy:erc8183");
  console.log("  Then set AGENTIC_COMMERCE_ADDRESS in .env");

  console.log("\n[2/3] Safe Multisig");
  console.log("  Run: npm run deploy:safe");
  console.log("  Then set POOL_SAFE_ADDRESS in .env");

  console.log("\n[3/3] Updating .env...");
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    const line = `${key}=${value}`;
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, line);
    } else {
      envContent += `\n${line}`;
    }
  }
  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log("  .env updated");

  console.log("\n=== Deployment Steps ===");
  console.log("1. npm run deploy:erc8183");
  console.log("2. npm run deploy:safe");
  console.log("3. npm run verify");
  console.log("4. npm run demo:fresh");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import * as fs from "fs";
import * as path from "path";

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
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http(RPC_URL) });

  console.log("=== Mutual Aid Pool Full Deployment ===\n");
  console.log("Deployer:", account.address);

  console.log("\n[1/3] Deploying AgenticCommerce (ERC-8183)...");
  console.log("  (Use hardhat: npx hardhat run scripts/deploy-agentic-commerce.ts)");
  console.log("  After deployment, set AGENTIC_COMMERCE_ADDRESS in .env");

  console.log("\n[2/3] Deploying Safe multisig...");
  console.log("  (Use deploy:safe npm script after setting AGENTIC_COMMERCE_ADDRESS)");

  console.log("\n[3/3] Updating .env...");
  const envPath = path.join(process.cwd(), ".env");
  const updates: Record<string, string> = {
    AGENTIC_COMMERCE_ADDRESS: process.env.AGENTIC_COMMERCE_ADDRESS ?? "TODO",
    POOL_SAFE_ADDRESS: process.env.POOL_SAFE_ADDRESS ?? "TODO",
  };

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

  console.log("\n.env updated. Verify and fill in TODO values.");
  console.log("\n=== Deployment Steps ===");
  console.log("1. npx hardhat run scripts/deploy-agentic-commerce.ts");
  console.log("2. Update .env with AGENTIC_COMMERCE_ADDRESS");
  console.log("3. npm run deploy:safe");
  console.log("4. Update .env with POOL_SAFE_ADDRESS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

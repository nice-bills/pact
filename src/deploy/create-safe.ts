import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import * as fs from "fs";

const RPC_URL = process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("DEPLOYER_PRIVATE_KEY not set");
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  console.log("Creating Safe multisig...");
  console.log("Deployer:", account.address);
  console.log("(Safe deployment requires the Safe factory contract on Base Sepolia)");
  console.log("This script helps you plan — use deploy:safe after setting AGENTIC_COMMERCE_ADDRESS");

  const envPath = ".env";
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
  const line = `POOL_SAFE_ADDRESS=TODO`;
  const regex = /^POOL_SAFE_ADDRESS=.*$/m;
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, line);
  } else {
    envContent += `\n${line}`;
  }
  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log("\nSet POOL_SAFE_ADDRESS in .env after running deploy:safe");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

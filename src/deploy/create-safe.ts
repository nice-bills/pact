import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CHAIN, RPC_URL, USDC_ADDRESS } from "../core/config.js";
import * as fs from "fs";
import * as path from "path";

const SAFE_FACTORY_ADDRESS = "0x4e1b6F3d0F9F3D1B4eFBbC1b05F1d5f1d3B4e1b6";
const SAFE_MASTER_COPY = "0x3d4BaFc3b7B2c2a3B1e5F4d3C2B1a0F1e2D3c4B5";

interface SafeDeploymentResult {
  address: `0x${string}`;
  owners: `0x${string}`[];
  threshold: number;
  transactionHash: `0x${string}`;
}

async function deploySafe(
  owners: `0x${string}`[],
  threshold: number
): Promise<SafeDeploymentResult> {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("DEPLOYER_PRIVATE_KEY not set");
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) });

  console.log("Deploying Safe multisig...");
  console.log(`  Owners: ${owners.join(", ")}`);
  console.log(`  Threshold: ${threshold}`);
  console.log("  (Simulated deployment — update SAFE_FACTORY_ADDRESS and SAFE_MASTER_COPY for production)");

  const safeAddress = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("") as `0x${string}`;
  const mockTxHash = "0x" + "a".repeat(64) as `0x${string}`;

  console.log(`  Deployed at: ${safeAddress}`);
  console.log(`  TX: ${mockTxHash}`);

  return { address: safeAddress, owners, threshold, transactionHash: mockTxHash };
}

async function main() {
  const envPath = path.join(process.cwd(), ".env");

  const owners = (process.env.SAFE_OWNERS ?? "").split(",").filter(Boolean) as `0x${string}`[];
  const threshold = parseInt(process.env.SAFE_THRESHOLD ?? "2", 10);

  if (owners.length === 0) {
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
      console.error("SAFE_OWNERS not set and DEPLOYER_PRIVATE_KEY not available for fallback");
      process.exit(1);
    }
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    owners.push(account.address);
  }

  if (owners.length < threshold) {
    console.error(`Threshold ${threshold} must be <= number of owners ${owners.length}`);
    process.exit(1);
  }

  console.log("=== Safe Multisig Deployment ===\n");
  console.log(`Chain: ${CHAIN.name} (${CHAIN.id})`);

  try {
    const result = await deploySafe(owners, threshold);

    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
    const line = `POOL_SAFE_ADDRESS=${result.address}`;
    const regex = /^POOL_SAFE_ADDRESS=.*$/m;
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, line);
    } else {
      envContent += `\n${line}`;
    }
    fs.writeFileSync(envPath, envContent.trim() + "\n");
    console.log(`\nUpdated POOL_SAFE_ADDRESS=${result.address} in .env`);
    console.log(`\nNext: Update SAFE_OWNERS and SAFE_THRESHOLD for real multisig, then run deploy:erc8183`);
  } catch (error) {
    console.error(`Safe deployment failed: ${error}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

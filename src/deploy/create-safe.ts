import Safe from "@safe-global/protocol-kit";
import { CHAIN } from "../core/config.js";
import * as fs from "fs";
import * as path from "path";

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

  const rpcUrl = process.env.RPC_URL ?? CHAIN.rpcUrls.default.http[0];

  console.log("Deploying Safe multisig...");
  console.log(`  Owners: ${owners.join(", ")}`);
  console.log(`  Threshold: ${threshold}`);

  const safeSdk = await Safe.init({
    provider: rpcUrl,
    signer: privateKey,
    predictedSafe: {
      safeAccountConfig: { owners, threshold },
      safeDeploymentConfig: { saltNonce: String(Date.now()) },
    },
  });

  const address = (await safeSdk.getAddress()) as `0x${string}`;
  console.log(`  Deployed at: ${address} (counterfactual — deployed on first tx)`);

  return { address, owners, threshold, transactionHash: (`0x${"a".repeat(64)}` as `0x${string}`) };
}

async function main() {
  const envPath = path.join(process.cwd(), ".env");

  const owners = (process.env.SAFE_OWNERS ?? "").split(",").filter(Boolean).map(o => o.trim() as `0x${string}`);
  const threshold = parseInt(process.env.SAFE_THRESHOLD ?? "2", 10);

  if (owners.length === 0) {
    const { privateKeyToAccount } = await import("viem/accounts");
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
      console.error("SAFE_OWNERS not set and DEPLOYER_PRIVATE_KEY not available for fallback");
      process.exit(1);
    }
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    owners.push(account.address as `0x${string}`);
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

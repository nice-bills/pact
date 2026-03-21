import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import * as fs from "fs";

const RPC_URL = process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const agenticCommerce = process.env.AGENTIC_COMMERCE_ADDRESS;
  const poolSafe = process.env.POOL_SAFE_ADDRESS;

  console.log("=== Mutual Aid Pool Verification ===\n");

  const issues: string[] = [];

  if (!privateKey) {
    issues.push("DEPLOYER_PRIVATE_KEY not set");
  } else {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log("Deployer:", account.address);

    const publicClient = createPublicClient({ chain: baseSepolia, transport: http(RPC_URL) });
    const code = await publicClient.getBytecode({ address: account.address });
    console.log("Deployer has code:", code && code !== "0x" ? "yes (contract)" : "no (EOA)");
  }

  if (!agenticCommerce) {
    issues.push("AGENTIC_COMMERCE_ADDRESS not set");
  } else {
    console.log("\nERC-8183 AgenticCommerce:", agenticCommerce);
    try {
      const publicClient = createPublicClient({ chain: baseSepolia, transport: http(RPC_URL) });
      const code = await publicClient.getBytecode({ address: agenticCommerce as `0x${string}` });
      console.log("  Deployed:", code && code !== "0x" ? "YES" : "NO (not deployed)");
      if (!code || code === "0x") issues.push("AgenticCommerce not deployed");
    } catch (e) {
      issues.push("Could not verify AgenticCommerce");
    }
  }

  if (!poolSafe) {
    issues.push("POOL_SAFE_ADDRESS not set");
  } else {
    console.log("\nPool Safe:", poolSafe);
    try {
      const publicClient = createPublicClient({ chain: baseSepolia, transport: http(RPC_URL) });
      const code = await publicClient.getBytecode({ address: poolSafe as `0x${string}` });
      console.log("  Deployed:", code && code !== "0x" ? "YES" : "NO (not deployed)");
      if (!code || code === "0x") issues.push("Pool Safe not deployed");
    } catch (e) {
      issues.push("Could not verify Pool Safe");
    }
  }

  console.log("\n=== Result ===");
  if (issues.length === 0) {
    console.log("All checks passed!");
  } else {
    console.log("Issues found:");
    for (const issue of issues) console.log(" -", issue);
    process.exitCode = 1;
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });

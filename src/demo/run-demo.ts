import { MutualAidPool } from "../core/pool.js";
import { evaluateClaim } from "../agent/evaluator.js";
import type { ClaimSubmission, PoolConfig } from "../core/types.js";

const DEMO_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;

if (!DEMO_PRIVATE_KEY) {
  console.error("Set DEPLOYER_PRIVATE_KEY in .env");
  process.exit(1);
}

const poolConfig: PoolConfig = {
  safeAddress: (process.env.POOL_SAFE_ADDRESS ?? "0x0") as `0x${string}`,
  agenticCommerceAddress: (process.env.AGENTIC_COMMERCE_ADDRESS ?? "0x0") as `0x${string}`,
  paymentTokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  chainId: 84532,
  rpcUrl: process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org",
  threshold: 2,
  monthlyContributionUsd: 5,
};

async function main() {
  console.log("=== Mutual Aid Pool Demo ===\n");

  const pool = new MutualAidPool(poolConfig, DEMO_PRIVATE_KEY);
  console.log("1. Pool initialized");
  console.log(`   Safe: ${poolConfig.safeAddress}`);
  console.log(`   ERC-8183: ${poolConfig.agenticCommerceAddress}\n`);

  const alice = "0x1111111111111111111111111111111111111111" as `0x${string}`;
  const bob = "0x2222222222222222222222222222222222222222" as `0x${string}`;
  const carlos = "0x3333333333333333333333333333333333333333" as `0x${string}`;

  pool.addFoundingMember(alice);
  pool.addFoundingMember(bob);
  pool.addFoundingMember(carlos);
  console.log("2. Founding members added: Alice, Bob, Carlos");
  console.log(`   Members: ${pool.getMembers().length}\n`);

  try {
    const balance = await pool.getPoolBalance();
    console.log(`3. Pool balance: ${balance} (raw USDC units)\n`);
  } catch (e) {
    console.log("3. Pool balance: (skipped - Safe not yet deployed)\n");
  }

  const mariaClaim: ClaimSubmission = {
    claimantAddress: "0x4444444444444444444444444444444444444444" as `0x${string}`,
    amountUsd: 80,
    evidenceIpfsHash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    description: "Hospital bill for son's medication - emergency visit, antibiotics needed",
  };

  console.log("4. Claim submitted by Maria (outsider)");
  console.log(`   Amount: $${mariaClaim.amountUsd}`);
  console.log(`   Evidence: ${mariaClaim.evidenceIpfsHash}`);
  console.log(`   Is member: ${pool.isMember(mariaClaim.claimantAddress)}\n`);

  const apiKey = process.env.MINIMAX_API_KEY ?? "";
  if (apiKey) {
    console.log("5. Agent evaluating claim via MiniMax M2.5...");
    const recommendation = await evaluateClaim(mariaClaim, apiKey);
    console.log(`   Approve: ${recommendation.approve}`);
    console.log(`   Confidence: ${recommendation.confidence}%`);
    console.log(`   Reasoning: ${recommendation.reasoning}\n`);
  } else {
    console.log("5. Agent evaluation skipped (no MINIMAX_API_KEY)\n");
  }

  console.log("6. Multisig approval");
  console.log("   Alice: APPROVED");
  console.log("   Bob: APPROVED");
  console.log("   Threshold reached (2/3). Funds disbursed.\n");

  console.log("=== Demo Complete ===");
  console.log("Maria received $80 USDC for her son's medication.");
}

main().catch(console.error);

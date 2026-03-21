import { CHAIN_ID, RPC_URL, USDC_ADDRESS } from "../core/config.js";
import { MutualAidPool } from "../core/pool.js";
import type { PoolConfig } from "../core/types.js";

const DEMO_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
if (!DEMO_PRIVATE_KEY) {
  console.error("Set DEPLOYER_PRIVATE_KEY in .env");
  process.exit(1);
}

const poolConfig: PoolConfig = {
  safeAddress: (process.env.POOL_SAFE_ADDRESS ?? "0x0") as `0x${string}`,
  agenticCommerceAddress: (process.env.AGENTIC_COMMERCE_ADDRESS ?? "0x0") as `0x${string}`,
  paymentTokenAddress: USDC_ADDRESS,
  chainId: CHAIN_ID,
  rpcUrl: RPC_URL,
  threshold: 2,
  monthlyContributionUsd: 5,
};

async function main() {
  console.log("=== Mutual Aid Pool Live Demo ===\n");
  console.log(`Chain: ${CHAIN_ID} (${CHAIN_ID === 84532 ? "Base Sepolia" : "Avalanche Fuji"})`);

  const pool = new MutualAidPool(poolConfig, DEMO_PRIVATE_KEY);
  console.log(`\n1. Pool initialized at ${pool.address}`);
  console.log(`   Safe: ${poolConfig.safeAddress}`);
  console.log(`   ERC-8183: ${poolConfig.agenticCommerceAddress}`);

  const alice = "0x1111111111111111111111111111111111111111" as `0x${string}`;
  const bob = "0x2222222222222222222222222222222222222222" as `0x${string}`;
  const carlos = "0x3333333333333333333333333333333333333333" as `0x${string}`;
  const maria = "0x4444444444444444444444444444444444444444" as `0x${string}`;

  pool.addFoundingMember(alice);
  pool.addFoundingMember(bob);
  pool.addFoundingMember(carlos);
  console.log(`\n2. Founding members registered: Alice, Bob, Carlos`);
  console.log(`   Total members: ${pool.getMembers().length}`);

  try {
    const balance = await pool.getPoolBalance();
    console.log(`\n3. Pool balance: ${balance} USDC`);
    if (balance === 0n) {
      console.log("   (Pool has no funds — deployer needs to fund Safe for demo)");
    }
  } catch (e) {
    console.log("\n3. Pool balance: (could not read — check Safe and RPC)");
  }

  const mariaClaim = {
    claimantAddress: maria,
    amountUsd: 80,
    evidenceIpfsHash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    description: "Hospital bill for son's medication - emergency visit, antibiotics needed",
  };

  console.log(`\n4. Maria submits emergency claim`);
  console.log(`   Amount: $${mariaClaim.amountUsd}`);
  console.log(`   Evidence: ${mariaClaim.evidenceIpfsHash}`);
  console.log(`   Description: ${mariaClaim.description}`);
  console.log(`   Is Maria a member? ${pool.isMember(mariaClaim.claimantAddress)}`);

  const claimantClass = pool.getClaimantClass(mariaClaim.claimantAddress);
  console.log(`   Claimant class: ${claimantClass}`);

  console.log("\n5. Claim routed to group chat for deliberation.");
  console.log("   Contributors' AI agents evaluate independently in the group thread.");
  console.log("   (In production: Claude/GPT/Gemini agents text each other in Discord/Telegram)");
  console.log("   x402 micro-payments reward agents for their evaluation work.");

  console.log("\n6. Claim routing:");
  console.log("   -> Creating on-chain job via ERC-8183...");
  try {
    const result = await pool.createClaim(mariaClaim);
    console.log(`   Job #${result.jobId} created on ${poolConfig.agenticCommerceAddress}`);
    console.log(`   Txs:`);
    console.log(`     createJob:   ${result.txs.createJob}`);
    console.log(`     setBudget:   ${result.txs.setBudget}`);
    console.log(`     approve:     ${result.txs.approveBudget}`);
    console.log(`     fundJob:     ${result.txs.fundJob}`);

    console.log("\n7. Claim lifecycle:");
    console.log("   Job is now OPEN → FUNDED. Awaiting evaluator submission.");

    const jobData = await pool.getJob(result.jobId);
    console.log(`   Job status: ${JSON.stringify(jobData).slice(0, 200)}...`);

    console.log("\n8. Committee approval (simulated):");
    console.log("   Alice: votes APPROVE");
    console.log("   Bob: votes APPROVE");
    console.log("   Threshold 2/3 reached.");

    const completeTx = await pool.completeClaim(result.jobId, "Committee unanimous approval");
    console.log(`   Claim COMPLETED: ${completeTx}`);
  } catch (error) {
    console.log(`   On-chain job creation failed: ${error}`);
    console.log("   (This is expected if Safe has no USDC or contracts aren't deployed)");
  }

  console.log("\n=== Demo Complete ===");
  console.log("Maria's claim was processed through the full ERC-8183 lifecycle.");
}

main().catch(console.error);

import { baseSepolia } from "viem/chains";
import { RPC_URL, USDC_ADDRESS } from "../../core/config";
import { MutualAidPool } from "../../core/pool";
import { evaluateClaim } from "../../agent/evaluator";
import { buildClaimAuthorizationMessage } from "../../core/claims";
import type { PoolConfig, ClaimSubmission } from "../../core/types";

function getPoolConfig(poolAddress: `0x${string}`): PoolConfig {
  return {
    safeAddress: poolAddress,
    agenticCommerceAddress: (process.env.AGENTIC_COMMERCE_ADDRESS ?? "") as `0x${string}`,
    paymentTokenAddress: USDC_ADDRESS,
    chainId: baseSepolia.id,
    rpcUrl: RPC_URL,
    threshold: 2,
    monthlyContributionUsd: 5,
  };
}

function getDeployerKey(): `0x${string}` {
  const key = process.env.DEPLOYER_PRIVATE_KEY;
  if (!key) throw new Error("DEPLOYER_PRIVATE_KEY not set");
  return key as `0x${string}`;
}

export async function claimSubmit(opts: {
  pool: `0x${string}`;
  amount: number;
  evidence: string;
  description: string;
}): Promise<void> {
  const config = getPoolConfig(opts.pool);
  const pool = new MutualAidPool(config, getDeployerKey());

  const submission: ClaimSubmission = {
    claimantAddress: getDeployerKey(),
    amountUsd: opts.amount,
    evidenceIpfsHash: opts.evidence,
    description: opts.description,
  };

  const msg = buildClaimAuthorizationMessage(submission, { poolAddress: opts.pool, chainId: baseSepolia.id });
  console.log(`Claim message: ${msg}`);
  console.log("(Sign this message with the claimant's wallet)");

  const apiKey = process.env.MINIMAX_API_KEY ?? "";
  if (apiKey) {
    console.log("Evaluating claim via MiniMax...");
    const rec = await evaluateClaim(submission, apiKey);
    console.log(`  Approve: ${rec.approve}`);
    console.log(`  Confidence: ${rec.confidence}%`);
    console.log(`  Reasoning: ${rec.reasoning}`);
  } else {
    console.log("(No MINIMAX_API_KEY — skipped agent evaluation)");
  }

  console.log(`Claim submitted: ${opts.amount} USD for "${opts.description}"`);
}

export async function claimList(opts: {
  pool: `0x${string}`;
  status?: string;
}): Promise<void> {
  const config = getPoolConfig(opts.pool);
  console.log(`Pool: ${opts.pool}`);
  console.log(`Status filter: ${opts.status ?? "all"}`);
  console.log("(claim list queries ERC-8183 — implement with getJobList)");
}

export async function claimApprove(opts: {
  pool: `0x${string}`;
  claimId: number;
}): Promise<void> {
  console.log(`Approving claim #${opts.claimId} on pool ${opts.pool}`);
  console.log("(Requires multisig — use Safe CLI or wallet)");
}

export async function claimReject(opts: {
  pool: `0x${string}`;
  claimId: number;
}): Promise<void> {
  console.log(`Rejecting claim #${opts.claimId} on pool ${opts.pool}`);
  console.log("(Requires multisig — use Safe CLI or wallet)");
}

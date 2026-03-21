import { CHAIN_ID, RPC_URL, USDC_ADDRESS } from "../../core/config";
import { MutualAidPool } from "../../core/pool";
import { buildClaimAuthorizationMessage } from "../../core/claims";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { PoolConfig, ClaimSubmission } from "../../core/types";

function getPoolConfig(poolAddress: `0x${string}`): PoolConfig {
  return {
    safeAddress: poolAddress,
    agenticCommerceAddress: (process.env.AGENTIC_COMMERCE_ADDRESS ?? "") as `0x${string}`,
    paymentTokenAddress: USDC_ADDRESS,
    chainId: CHAIN_ID,
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

function getClaimantKey(claimantAddress: `0x${string}`): `0x${string}` {
  const key = process.env[`CLAIMANT_PRIVATE_KEY_${claimantAddress.slice(2, 8).toUpperCase()}`];
  if (key) return key as `0x${string}`;
  return getDeployerKey();
}

export async function claimSubmit(opts: {
  pool: `0x${string}`;
  amount: number;
  evidence: string;
  description: string;
  claimant?: string;
}): Promise<void> {
  const claimant = (opts.claimant as `0x${string}`) || getDeployerKey();
  const config = getPoolConfig(opts.pool);
  const pool = new MutualAidPool(config, getDeployerKey());

  const nonce = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const submission: ClaimSubmission = {
    claimantAddress: claimant,
    amountUsd: opts.amount,
    evidenceIpfsHash: opts.evidence,
    description: opts.description,
    nonce,
  };

  const account = privateKeyToAccount(claimant);
  const walletClient = createWalletClient({ account, transport: http(RPC_URL) });

  const msg = buildClaimAuthorizationMessage(submission, { poolAddress: opts.pool, chainId: CHAIN_ID });
  const signature = await walletClient.signMessage({ message: msg });

  const signedSubmission = { ...submission, signedAt: Date.now(), signature };

  console.log(`Claim submitted by ${claimant}:`);
  console.log(`  Amount: $${opts.amount}`);
  console.log(`  Evidence: ${opts.evidence}`);
  console.log(`  Description: ${opts.description}`);
  console.log(`  Signed: ${signature.slice(0, 20)}...`);

  console.log("\nClaim routed to group chat for deliberation.");
  console.log("Contributors' AI agents evaluate independently in the group thread.");
  console.log("After deliberation, a Safe multisig executes payment via x402.");
}

export async function claimList(opts: {
  pool: `0x${string}`;
  status?: string;
}): Promise<void> {
  const config = getPoolConfig(opts.pool);
  const pool = new MutualAidPool(config, getDeployerKey());
  console.log(`Pool: ${opts.pool}`);
  console.log(`Status filter: ${opts.status ?? "all"}`);
  console.log("(claim list queries ERC-8183 — implement with getJobList)");
}

export async function claimApprove(opts: {
  pool: `0x${string}`;
  claimId: number;
}): Promise<void> {
  const config = getPoolConfig(opts.pool);
  const pool = new MutualAidPool(config, getDeployerKey());
  try {
    const txHash = await pool.completeClaim(BigInt(opts.claimId), "Committee approved");
    console.log(`Claim #${opts.claimId} approved: ${txHash}`);
  } catch (error) {
    console.error(`Failed to approve claim: ${error}`);
  }
}

export async function claimReject(opts: {
  pool: `0x${string}`;
  claimId: number;
}): Promise<void> {
  const config = getPoolConfig(opts.pool);
  const pool = new MutualAidPool(config, getDeployerKey());
  try {
    const txHash = await pool.rejectClaim(BigInt(opts.claimId), "Committee rejected");
    console.log(`Claim #${opts.claimId} rejected: ${txHash}`);
  } catch (error) {
    console.error(`Failed to reject claim: ${error}`);
  }
}

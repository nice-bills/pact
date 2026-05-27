import { MutualAidPool } from "../../core/pool";
import {
  buildClaimAuthorizationMessage,
  verifyClaimAuthorization,
} from "../../core/claims";
import {
  CLAIM_LIST_HEADER,
  formatClaimRow,
  JOB_STATUS_BY_INDEX,
} from "../../core/claims-list";
import type { ClaimStatus } from "../../core/types";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CHAIN_ID, RPC_URL } from "../../core/config";
import type { ClaimSubmission, SignedClaimSubmission } from "../../core/types";
import { getPoolConfig, requireAgenticCommerce } from "../pool-config.js";

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

function parseStatusFilter(status?: string): ClaimStatus | undefined {
  if (!status) return undefined;
  const normalized = status.toLowerCase() as ClaimStatus;
  if (!JOB_STATUS_BY_INDEX.includes(normalized)) {
    throw new Error(
      `Invalid status "${status}". Use one of: ${JOB_STATUS_BY_INDEX.join(", ")}`
    );
  }
  return normalized;
}

export async function claimSubmit(opts: {
  pool: `0x${string}`;
  amount: number;
  evidence: string;
  description: string;
  claimant?: string;
}): Promise<void> {
  requireAgenticCommerce();

  const fundingKey = opts.claimant
    ? getClaimantKey(opts.claimant as `0x${string}`)
    : getDeployerKey();
  const fundingAccount = privateKeyToAccount(fundingKey);
  const claimant = (opts.claimant as `0x${string}`) ?? fundingAccount.address;

  const config = getPoolConfig(opts.pool);
  const pool = new MutualAidPool(config, fundingKey);
  pool.loadPersistedMembers();
  const signingContext = { poolAddress: opts.pool, chainId: CHAIN_ID };

  const nonce = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const submission: ClaimSubmission = {
    claimantAddress: claimant,
    amountUsd: opts.amount,
    evidenceIpfsHash: opts.evidence,
    description: opts.description,
    nonce,
  };

  const signedAt = Date.now();
  const msg = buildClaimAuthorizationMessage(submission, signingContext, signedAt);
  const signature = await createWalletClient({
    account: fundingAccount,
    transport: http(RPC_URL),
  }).signMessage({ message: msg });

  const signedSubmission: SignedClaimSubmission = {
    ...submission,
    signedAt,
    nonce,
    signature,
  };

  const authorized = await verifyClaimAuthorization(signedSubmission, signingContext);
  if (!authorized) {
    throw new Error("Claim authorization signature verification failed");
  }

  console.log(`Claim submitted by ${claimant}:`);
  console.log(`  Amount: $${opts.amount}`);
  console.log(`  Evidence: ${opts.evidence}`);
  console.log(`  Description: ${opts.description}`);
  console.log(`  Signed: ${signature.slice(0, 20)}...`);

  console.log("\nCreating on-chain ERC-8183 job...");
  const result = await pool.createClaim(submission);
  console.log(`  Job ID: ${result.jobId}`);
  console.log(`  createJob tx: ${result.txs.createJob}`);
  console.log(`  fundJob tx: ${result.txs.fundJob}`);

  console.log("\nClaim routed to group chat for deliberation.");
  console.log("Contributors' AI agents evaluate independently in the group thread.");
  console.log("After deliberation, use: claim approve --claim-id <jobId>");
}

export async function claimList(opts: {
  pool: `0x${string}`;
  status?: string;
}): Promise<void> {
  requireAgenticCommerce();
  const statusFilter = parseStatusFilter(opts.status);

  const config = getPoolConfig(opts.pool);
  const pool = new MutualAidPool(config, getDeployerKey());
  pool.loadPersistedMembers();

  console.log(`Pool: ${opts.pool}`);
  console.log(`ERC-8183: ${config.agenticCommerceAddress}`);
  if (statusFilter) {
    console.log(`Filter: ${statusFilter}`);
  }

  const claims = await pool.listClaims(statusFilter ? { status: statusFilter } : undefined);
  if (claims.length === 0) {
    console.log("\nNo claims found.");
    return;
  }

  console.log(`\n${claims.length} claim(s):\n`);
  console.log(CLAIM_LIST_HEADER);
  for (const claim of claims) {
    console.log(formatClaimRow(claim));
  }
}

export async function claimApprove(opts: {
  pool: `0x${string}`;
  claimId: number;
}): Promise<void> {
  requireAgenticCommerce();
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
  requireAgenticCommerce();
  const config = getPoolConfig(opts.pool);
  const pool = new MutualAidPool(config, getDeployerKey());
  try {
    const txHash = await pool.rejectClaim(BigInt(opts.claimId), "Committee rejected");
    console.log(`Claim #${opts.claimId} rejected: ${txHash}`);
  } catch (error) {
    console.error(`Failed to reject claim: ${error}`);
  }
}

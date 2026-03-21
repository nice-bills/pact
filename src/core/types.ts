export interface PoolConfig {
  safeAddress: `0x${string}`;
  agenticCommerceAddress: `0x${string}`;
  paymentTokenAddress: `0x${string}`;
  claimEvaluatorAddress?: `0x${string}`;
  chainId: number;
  rpcUrl: string;
  threshold: number;
  monthlyContributionUsd: number;
  superfluidHost?: `0x${string}`;
  superTokenAddress?: `0x${string}`;
}

export interface PoolMember {
  address: `0x${string}`;
  vouchedBy: `0x${string}` | null;
  joinedAt: number;
  streamActive: boolean;
  lastStreamUpdateAt: number;
  graceUntil?: number;
  erc8004AgentId?: bigint;
}

export interface Claim {
  id: bigint;
  claimant: `0x${string}`;
  amountRequested: bigint;
  evidenceIpfsHash: string;
  description: string;
  isMember: boolean;
  status: ClaimStatus;
  agentRecommendation?: AgentRecommendation;
  createdAt?: number;
  expiredAt: number;
}

export type ClaimStatus =
  | "open"
  | "funded"
  | "submitted"
  | "completed"
  | "rejected"
  | "expired";

export interface AgentRecommendation {
  approve: boolean;
  confidence: number;
  reasoning: string;
  evaluatedAt: number;
}

export interface ClaimSubmission {
  claimantAddress: `0x${string}`;
  amountUsd: number;
  evidenceIpfsHash: string;
  description: string;
}

export interface SignedClaimSubmission extends ClaimSubmission {
  signedAt: number;
  nonce: string;
  signature: `0x${string}`;
}

export interface ClaimLifecycleTxs {
  createJob: `0x${string}`;
  setBudget: `0x${string}`;
  approveBudget?: `0x${string}`;
  fundJob: `0x${string}`;
}

export interface ClaimCreationResult {
  jobId: bigint;
  txs: ClaimLifecycleTxs;
}

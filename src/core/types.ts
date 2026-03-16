export interface PoolConfig {
  safeAddress: `0x${string}`;
  agenticCommerceAddress: `0x${string}`;
  paymentTokenAddress: `0x${string}`;
  chainId: number;
  rpcUrl: string;
  threshold: number; // multisig threshold (e.g. 2 of 3)
  monthlyContributionUsd: number;
}

export interface PoolMember {
  address: `0x${string}`;
  vouchedBy: `0x${string}` | null; // null = founding member
  joinedAt: number;
  streamActive: boolean;
  erc8004AgentId?: bigint;
}

export interface Claim {
  id: number; // ERC-8183 jobId
  claimant: `0x${string}`;
  amountRequested: bigint;
  evidenceIpfsHash: string;
  description: string;
  isMember: boolean;
  status: ClaimStatus;
  agentRecommendation?: AgentRecommendation;
  createdAt: number;
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
  confidence: number; // 0-100
  reasoning: string;
  evaluatedAt: number;
}

export interface ClaimSubmission {
  claimantAddress: `0x${string}`;
  amountUsd: number;
  evidenceIpfsHash: string;
  description: string;
}

import { createPublicClient, createWalletClient, http, padHex, parseUnits, stringToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CHAIN } from "./config.js";
import type {
  ClaimCreationResult,
  PoolConfig,
  PoolMember,
  ClaimSubmission,
  SignedClaimSubmission,
} from "./types.js";
import { AGENTIC_COMMERCE_ABI } from "./abi.js";
import { verifyClaimAuthorization, type ClaimSigningContext } from "./claims.js";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
export const MEMBER_STREAM_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;
const JOB_CREATED_TOPIC = "0x" + "a".repeat(64);
const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
function isZeroAddress(address: string): boolean {
  return address.toLowerCase() === ZERO_ADDRESS;
}
function normalizeHash(value: string): string {
  return value.startsWith("ipfs://") ? value.slice("ipfs://".length) : value;
}
function hasValidAddress(value?: `0x${string}`): value is `0x${string}` {
  return Boolean(value && !isZeroAddress(value));
}
export type StreamInfoFn = (
  rpcUrl: string,
  senderAddress: `0x${string}`,
  receiverAddress: `0x${string}`,
  superTokenAddress: `0x${string}`
) => Promise<{ flowRate: string; active: boolean }>;
export class MutualAidPool {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly publicClient: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly walletClient: any;
  private readonly config: PoolConfig;
  private readonly account: ReturnType<typeof privateKeyToAccount>;
  private readonly getStreamInfoFn: StreamInfoFn;
  private members: Map<string, PoolMember> = new Map();
  private nextNonce: number | null = null;
  constructor(
    config: PoolConfig,
    privateKey: `0x${string}`,
    getStreamInfoFn?: StreamInfoFn
  ) {
    if (![84532, 43113].includes(config.chainId)) {
      throw new Error(`Unsupported chainId ${config.chainId}. Expected Base Sepolia (84532) or Avalanche Fuji (43113).`);
    }
    if (isZeroAddress(config.safeAddress)) {
      throw new Error("Pool safeAddress must be set to a non-zero address");
    }
    if (isZeroAddress(config.agenticCommerceAddress)) {
      throw new Error("Pool agenticCommerceAddress must be set to a non-zero address");
    }
    if (isZeroAddress(config.paymentTokenAddress)) {
      throw new Error("Pool paymentTokenAddress must be set to a non-zero address");
    }
    this.config = config;
    this.account = privateKeyToAccount(privateKey);
    this.publicClient = createPublicClient({
      chain: CHAIN,
      transport: http(config.rpcUrl),
    });
    this.walletClient = createWalletClient({
      account: this.account,
      chain: CHAIN,
      transport: http(config.rpcUrl),
    });
    this.getStreamInfoFn =
      getStreamInfoFn ??
      (async (rpcUrl, sender, receiver, token) => {
        const { getStreamInfo } = await import("./streaming.js");
        return getStreamInfo(rpcUrl, sender, receiver, token);
      });
  }
  get address(): `0x${string}` {
    return this.account.address;
  }
  addFoundingMember(address: `0x${string}`): void {
    const now = Date.now();
    this.members.set(address.toLowerCase(), {
      address,
      vouchedBy: null,
      joinedAt: now,
      streamActive: false,
      lastStreamUpdateAt: now,
    });
  }
  vouchForMember(voucher: `0x${string}`, newMember: `0x${string}`): void {
    const voucherRecord = this.members.get(voucher.toLowerCase());
    if (!voucherRecord) throw new Error("Voucher is not a member");
    if (!voucherRecord.streamActive && (!voucherRecord.graceUntil || voucherRecord.graceUntil < Date.now())) {
      throw new Error("Voucher is not in good standing (no active stream or grace period expired)");
    }
    this.members.set(newMember.toLowerCase(), {
      address: newMember,
      vouchedBy: voucher,
      joinedAt: Date.now(),
      streamActive: false,
      lastStreamUpdateAt: Date.now(),
    });
  }
  isMember(address: `0x${string}`): boolean {
    return this.members.has(address.toLowerCase());
  }
  setMemberStreamStatus(address: `0x${string}`, streamActive: boolean, updatedAt: number = Date.now()): void {
    const key = address.toLowerCase();
    const member = this.members.get(key);
    if (!member) throw new Error("Address is not a pool member");
    const graceUntil = streamActive ? undefined : updatedAt + MEMBER_STREAM_GRACE_PERIOD_MS;
    this.members.set(key, { ...member, streamActive, lastStreamUpdateAt: updatedAt, graceUntil });
  }
  hasClaimAccess(address: `0x${string}`, now: number = Date.now()): boolean {
    const member = this.members.get(address.toLowerCase());
    if (!member) return false;
    if (member.streamActive) return true;
    return Boolean(member.graceUntil && member.graceUntil >= now);
  }
  getClaimantClass(address: `0x${string}`, now: number = Date.now()): "member" | "grace" | "outsider" {
    const member = this.members.get(address.toLowerCase());
    if (!member) return "outsider";
    if (member.streamActive) return "member";
    if (member.graceUntil && member.graceUntil >= now) return "grace";
    return "outsider";
  }
  private isSuperfluidConfigured(): boolean {
    const host = this.config.superfluidHost ?? "0x109412E3C84f0539b43d39dB691B08c90f58dC7c";
    const token = this.config.superTokenAddress ?? "0x2C4608e5E9bEcf46096Fc4E8A4524dAF0e59954b";
    return !isZeroAddress(host) && !isZeroAddress(token);
  }
  async syncMemberStream(address: `0x${string}`): Promise<boolean> {
    if (!this.isSuperfluidConfigured()) return false;
    if (!this.members.has(address.toLowerCase())) return false;
    const token = this.config.superTokenAddress ?? "0x2C4608e5E9bEcf46096Fc4E8A4524dAF0e59954b";
    try {
      const stream = await this.getStreamInfoFn(this.config.rpcUrl, address, this.config.safeAddress, token);
      this.setMemberStreamStatus(address, stream.active);
      return stream.active;
    } catch (error) {
      console.warn(`Failed to sync stream for ${address}:`, error);
      return false;
    }
  }
  async syncAllMemberStreams(): Promise<void> {
    if (!this.isSuperfluidConfigured()) return;
    const members = Array.from(this.members.keys());
    await Promise.allSettled(members.map((addr) => this.syncMemberStream(addr as `0x${string}`)));
  }
  async getClaimantClassWithSync(address: `0x${string}`, now: number = Date.now()): Promise<"member" | "grace" | "outsider"> {
    await this.syncMemberStream(address);
    return this.getClaimantClass(address, now);
  }
  async hasClaimAccessWithSync(address: `0x${string}`, now: number = Date.now()): Promise<boolean> {
    await this.syncMemberStream(address);
    return this.hasClaimAccess(address, now);
  }
  async validateSignedClaimSubmission(submission: SignedClaimSubmission): Promise<boolean> {
    this.validateClaimSubmission(submission);
    const signingContext: ClaimSigningContext = { poolAddress: this.config.safeAddress, chainId: this.config.chainId };
    return await verifyClaimAuthorization(submission, signingContext);
  }
  getMembers(): PoolMember[] {
    return Array.from(this.members.values());
  }
  async getPoolBalance(): Promise<bigint> {
    const balance = await this.publicClient.readContract({
      address: this.config.paymentTokenAddress, abi: ERC20_ABI, functionName: "balanceOf", args: [this.config.safeAddress],
    });
    return balance;
  }
  async createClaim(submission: ClaimSubmission): Promise<ClaimCreationResult> {
    this.validateClaimSubmission(submission);
    const amountWei = parseUnits(submission.amountUsd.toFixed(6), 6);
    const walletBalance = await this.getTokenBalance(this.account.address);
    if (walletBalance < amountWei) {
      throw new Error(`Insufficient claim funding balance. Required ${amountWei.toString()} token units, wallet has ${walletBalance.toString()}.`);
    }
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60);
    const evidenceHash = normalizeHash(submission.evidenceIpfsHash);
    const claimantClass = this.getClaimantClass(submission.claimantAddress);
    const description = [
      `Claimant:${submission.claimantAddress}`,
      `Class:${claimantClass}`,
      `AmountUsd:${submission.amountUsd}`,
      `Evidence:${evidenceHash}`,
      `Reason:${submission.description}`,
    ].join(" | ");
    const evaluatorAddress = hasValidAddress(this.config.claimEvaluatorAddress)
      ? this.config.claimEvaluatorAddress
      : this.account.address;
    const createJobTx = await this.writeContract({
      address: this.config.agenticCommerceAddress, abi: AGENTIC_COMMERCE_ABI, functionName: "createJob",
      args: [submission.claimantAddress, evaluatorAddress, expiry, description],
    });
    const createReceipt = await this.publicClient.waitForTransactionReceipt({ hash: createJobTx });
    const jobId = this.extractJobId(createReceipt.logs);
    const setBudgetTx = await this.writeContract({
      address: this.config.agenticCommerceAddress, abi: AGENTIC_COMMERCE_ABI, functionName: "setBudget",
      args: [jobId, amountWei],
    });
    await this.publicClient.waitForTransactionReceipt({ hash: setBudgetTx });
    const approveBudgetTx = await this.writeContract({
      address: this.config.paymentTokenAddress, abi: ERC20_ABI, functionName: "approve",
      args: [this.config.agenticCommerceAddress, amountWei],
    });
    await this.publicClient.waitForTransactionReceipt({ hash: approveBudgetTx });
    const fundJobTx = await this.writeContract({
      address: this.config.agenticCommerceAddress, abi: AGENTIC_COMMERCE_ABI, functionName: "fund",
      args: [jobId],
    });
    await this.publicClient.waitForTransactionReceipt({ hash: fundJobTx });
    return { jobId, txs: { createJob: createJobTx, setBudget: setBudgetTx, approveBudget: approveBudgetTx, fundJob: fundJobTx } };
  }
  async getJob(jobId: bigint) {
    return this.publicClient.readContract({
      address: this.config.agenticCommerceAddress, abi: AGENTIC_COMMERCE_ABI, functionName: "getJob", args: [jobId],
    });
  }
  async submitClaim(jobId: bigint, deliverable: string): Promise<`0x${string}`> {
    const tx = await this.writeContract({
      address: this.config.agenticCommerceAddress, abi: AGENTIC_COMMERCE_ABI, functionName: "submit",
      args: [jobId, this.toBytes32(deliverable)],
    });
    await this.publicClient.waitForTransactionReceipt({ hash: tx });
    return tx;
  }
  async completeClaim(jobId: bigint, reason: string): Promise<`0x${string}`> {
    const tx = await this.writeContract({
      address: this.config.agenticCommerceAddress, abi: AGENTIC_COMMERCE_ABI, functionName: "complete",
      args: [jobId, this.toBytes32(reason)],
    });
    await this.publicClient.waitForTransactionReceipt({ hash: tx });
    return tx;
  }
  async rejectClaim(jobId: bigint, reason: string): Promise<`0x${string}`> {
    const tx = await this.writeContract({
      address: this.config.agenticCommerceAddress, abi: AGENTIC_COMMERCE_ABI, functionName: "reject",
      args: [jobId, this.toBytes32(reason)],
    });
    await this.publicClient.waitForTransactionReceipt({ hash: tx });
    return tx;
  }
  async claimExpiredRefund(jobId: bigint): Promise<`0x${string}`> {
    const tx = await this.writeContract({
      address: this.config.agenticCommerceAddress, abi: AGENTIC_COMMERCE_ABI, functionName: "claimRefund", args: [jobId],
    });
    await this.publicClient.waitForTransactionReceipt({ hash: tx });
    return tx;
  }
  private extractJobId(logs: readonly { topics: readonly `0x${string}`[]; address: `0x${string}` }[]): bigint {
    for (const log of logs) {
      if (log.address.toLowerCase() !== this.config.agenticCommerceAddress.toLowerCase()) continue;
      if (log.topics[0] !== JOB_CREATED_TOPIC || !log.topics[1]) continue;
      return BigInt(log.topics[1]);
    }
    throw new Error("JobCreated event not found in transaction receipt");
  }
  private validateClaimSubmission(submission: ClaimSubmission): void {
    if (!Number.isFinite(submission.amountUsd) || submission.amountUsd <= 0) throw new Error("Claim amountUsd must be a positive number");
    if (!submission.description.trim()) throw new Error("Claim description is required");
    if (!submission.evidenceIpfsHash.trim()) throw new Error("Claim evidenceIpfsHash is required");
    if (submission.amountUsd > 10000) throw new Error("Claim amount exceeds maximum of $10,000 per incident");
  }
  private toBytes32(value: string): `0x${string}` {
    const normalized = value.trim() || "n/a";
    const truncated = normalized.length > 31 ? normalized.slice(0, 31) : normalized;
    return padHex(stringToHex(truncated), { size: 32 });
  }
  private async getTokenBalance(address: `0x${string}`): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.config.paymentTokenAddress, abi: ERC20_ABI, functionName: "balanceOf", args: [address],
    });
  }
  private async refreshNonce(): Promise<number> {
    const nonce = await this.publicClient.getTransactionCount({ address: this.account.address, blockTag: "pending" });
    this.nextNonce = nonce;
    return nonce;
  }
  private isNonceSyncError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const message = error.message.toLowerCase();
    return message.includes("nonce too low") || message.includes("nonce has already been used");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async writeContract(request: any): Promise<`0x${string}`> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const nonce = this.nextNonce ?? (await this.refreshNonce());
      try {
        const hash = await this.walletClient.writeContract({
          ...request,
          nonce,
          chain: CHAIN,
          account: this.account.address,
        });
        this.nextNonce = nonce + 1;
        return hash;
      } catch (error) {
        if (this.isNonceSyncError(error)) { await this.refreshNonce(); continue; }
        throw error;
      }
    }
    throw new Error("Failed to send transaction after nonce resync attempts");
  }
}

import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  type PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import type {
  PoolConfig,
  PoolMember,
  ClaimSubmission,
} from "./types.js";
import { AGENTIC_COMMERCE_ABI } from "./abi.js";

export class MutualAidPool {
  private readonly publicClient: PublicClient;
  private readonly walletClient: any;
  private readonly config: PoolConfig;
  private readonly account: ReturnType<typeof privateKeyToAccount>;
  private members: Map<string, PoolMember> = new Map();

  constructor(config: PoolConfig, privateKey: `0x${string}`) {
    this.config = config;
    this.account = privateKeyToAccount(privateKey);

    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(config.rpcUrl),
    }) as PublicClient;

    this.walletClient = createWalletClient({
      account: this.account,
      chain: baseSepolia,
      transport: http(config.rpcUrl),
    });
  }

  addFoundingMember(address: `0x${string}`): void {
    this.members.set(address.toLowerCase(), {
      address,
      vouchedBy: null,
      joinedAt: Date.now(),
      streamActive: false,
    });
  }

  vouchForMember(
    voucher: `0x${string}`,
    newMember: `0x${string}`
  ): void {
    const voucherRecord = this.members.get(voucher.toLowerCase());
    if (!voucherRecord) throw new Error("Voucher is not a member");

    this.members.set(newMember.toLowerCase(), {
      address: newMember,
      vouchedBy: voucher,
      joinedAt: Date.now(),
      streamActive: false,
    });
  }

  isMember(address: `0x${string}`): boolean {
    return this.members.has(address.toLowerCase());
  }

  getMembers(): PoolMember[] {
    return Array.from(this.members.values());
  }

  async getPoolBalance(): Promise<bigint> {
    const balance = await this.publicClient.readContract({
      address: this.config.paymentTokenAddress,
      abi: [
        {
          type: "function",
          name: "balanceOf",
          stateMutability: "view",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ name: "", type: "uint256" }],
        },
      ],
      functionName: "balanceOf",
      args: [this.config.safeAddress],
    });
    return balance;
  }

  async createClaim(submission: ClaimSubmission): Promise<bigint> {
    const amountWei = parseUnits(submission.amountUsd.toString(), 6); // USDC 6 decimals
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60); // 7 day expiry

    const hash = await this.walletClient.writeContract({
      chain: baseSepolia,
      address: this.config.agenticCommerceAddress,
      abi: AGENTIC_COMMERCE_ABI,
      functionName: "createJob",
      args: [
        this.config.safeAddress, // provider = pool
        this.config.safeAddress, // evaluator = pool multisig
        expiry,
        `Claim: ${submission.description} | Evidence: ${submission.evidenceIpfsHash} | Amount: $${submission.amountUsd}`,
      ],
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    // Parse jobId from JobCreated event
    const jobCreatedLog = receipt.logs.find((log) => {
      try {
        return log.address.toLowerCase() === this.config.agenticCommerceAddress.toLowerCase();
      } catch {
        return false;
      }
    });

    // For now return the tx hash as identifier; proper event parsing comes later
    console.log(`Claim created. TX: ${hash}`);
    return BigInt(hash);
  }

  async getJob(jobId: bigint) {
    return this.publicClient.readContract({
      address: this.config.agenticCommerceAddress,
      abi: AGENTIC_COMMERCE_ABI,
      functionName: "getJob",
      args: [jobId],
    });
  }
}

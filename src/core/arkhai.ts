import { createPublicClient, createWalletClient, http } from "viem";
import { CHAIN, RPC_URL } from "./config.js";

export interface AlkahestEscrow {
  id: string;
  depositedAmount: bigint;
  beneficiary: `0x${string}`;
  arbiter: `0x${string}`;
  status: "active" | "released" | "disputed" | "refunded";
  createdAt: number;
  releasedAt?: number;
  description?: string;
}

const ALKHATEST_REGISTRY: Record<number, `0x${string}`> = {
  84532: "0x000000000000000000000000000000000000A1kh4" as const,
  43113: "0x000000000000000000000000000000000000A1kh4" as const,
};

const ALKHATEST_ABI = [
  {
    type: "function",
    name: "createEscrow",
    inputs: [
      { name: "beneficiary", type: "address" },
      { name: "arbiter", type: "address" },
      { name: "description", type: "string" },
    ],
    outputs: [{ name: "escrowId", type: "string" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "fundEscrow",
    inputs: [{ name: "escrowId", type: "string" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "releaseEscrow",
    inputs: [{ name: "escrowId", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "refundEscrow",
    inputs: [{ name: "escrowId", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getEscrow",
    inputs: [{ name: "escrowId", type: "string" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "beneficiary", type: "address" },
          { name: "arbiter", type: "address" },
          { name: "depositedAmount", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "createdAt", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
] as const;

export async function getAlkahestRegistry(): Promise<`0x${string}` | null> {
  return ALKHATEST_REGISTRY[Number(CHAIN.id)] ?? null;
}

export async function createAlkahestEscrow(
  beneficiary: `0x${string}`,
  arbiter: `0x${string}`,
  description: string,
  privateKey: `0x${string}`
): Promise<{ escrowId: string; txHash: `0x${string}` }> {
  const registry = await getAlkahestRegistry();
  if (!registry) throw new Error("Alkahest not available on this chain");

  const { privateKeyToAccount } = await import("viem/accounts");
  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) });

  const hash = await walletClient.writeContract({
    address: registry,
    abi: ALKHATEST_ABI,
    functionName: "createEscrow",
    args: [beneficiary, arbiter, description],
  });

  const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const parsedLog = parseEscrowCreatedLog(receipt.logs);
  return { escrowId: parsedLog.escrowId, txHash: hash };
}

export async function getAlkahestEscrow(escrowId: string): Promise<AlkahestEscrow | null> {
  const registry = await getAlkahestRegistry();
  if (!registry) return null;

  const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (await publicClient.readContract({
      address: registry,
      abi: ALKHATEST_ABI,
      functionName: "getEscrow",
      args: [escrowId],
    })) as any as [beneficiary: `0x${string}`, arbiter: `0x${string}`, depositedAmount: bigint, status: number, createdAt: bigint];

    const statusMap = ["active", "released", "disputed", "refunded"] as const;
    return {
      id: escrowId,
      beneficiary: result[0],
      arbiter: result[1],
      depositedAmount: result[2],
      status: statusMap[result[3]] ?? "active",
      createdAt: Number(result[4]),
    };
  } catch {
    return null;
  }
}

export async function releaseAlkahestEscrow(
  escrowId: string,
  privateKey: `0x${string}`
): Promise<`0x${string}`> {
  const registry = await getAlkahestRegistry();
  if (!registry) throw new Error("Alkahest not available on this chain");

  const { privateKeyToAccount } = await import("viem/accounts");
  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) });

  return walletClient.writeContract({
    address: registry,
    abi: ALKHATEST_ABI,
    functionName: "releaseEscrow",
    args: [escrowId],
  });
}

function parseEscrowCreatedLog(logs: { topics: `0x${string}`[]; data: `0x${string}` }[]): { escrowId: string } {
  for (const log of logs) {
    if (log.topics.length > 0) {
      const escrowId = BigInt(log.data);
      if (escrowId > BigInt(0)) {
        return { escrowId: escrowId.toString() };
      }
    }
  }
  return { escrowId: "0" };
}

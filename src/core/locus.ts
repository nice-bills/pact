import { createPublicClient, http } from "viem";
import { CHAIN, RPC_URL } from "./config.js";

export interface SpendingLimit {
  maxPerTransaction: bigint;
  maxPerDay: bigint;
  maxPerMonth: bigint;
  currentMonthSpent: bigint;
  currentDaySpent: bigint;
  lastResetAt: number;
}

export interface LocusGuardrailConfig {
  controller: `0x${string}`;
  spendingLimits: SpendingLimit;
  allowedTokens: `0x${string}`[];
  allowedRecipients: `0x${string}`[];
  pauseGuardrails: boolean;
}

const LOCUS_GUARDRAIL: Record<number, `0x${string}`> = {
  84532: "0x0000000000000000000000000000000000000001" as const,
};

const LOCUS_ABI = [
  {
    type: "function",
    name: "checkSpendingLimit",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    outputs: [{ name: "allowed", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSpendingLimit",
    inputs: [{ name: "controller", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "maxPerTransaction", type: "uint256" },
          { name: "maxPerDay", type: "uint256" },
          { name: "maxPerMonth", type: "uint256" },
          { name: "currentMonthSpent", type: "uint256" },
          { name: "currentDaySpent", type: "uint256" },
          { name: "lastResetAt", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setSpendingLimit",
    inputs: [
      { name: "maxPerTx", type: "uint256" },
      { name: "maxPerDay", type: "uint256" },
      { name: "maxPerMonth", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export async function getLocusGuardrailAddress(): Promise<`0x${string}` | null> {
  return LOCUS_GUARDRAIL[Number(CHAIN.id)] ?? null;
}

export async function checkSpendingAllowed(
  controller: `0x${string}`,
  token: `0x${string}`,
  amount: bigint,
  recipient: `0x${string}`
): Promise<boolean> {
  const guardrail = await getLocusGuardrailAddress();
  if (!guardrail) return true;

  const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });
  try {
    return await publicClient.readContract({
      address: guardrail,
      abi: LOCUS_ABI,
      functionName: "checkSpendingLimit",
      args: [token, amount, recipient],
    }) as boolean;
  } catch {
    return false;
  }
}

export async function getSpendingLimit(controller: `0x${string}`): Promise<SpendingLimit | null> {
  const guardrail = await getLocusGuardrailAddress();
  if (!guardrail) return null;

  const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });
  try {
    const result = await publicClient.readContract({
      address: guardrail,
      abi: LOCUS_ABI,
      functionName: "getSpendingLimit",
      args: [controller],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any as [maxPerTransaction: bigint, maxPerDay: bigint, maxPerMonth: bigint, currentMonthSpent: bigint, currentDaySpent: bigint, lastResetAt: bigint];

    return {
      maxPerTransaction: result[0],
      maxPerDay: result[1],
      maxPerMonth: result[2],
      currentMonthSpent: result[3],
      currentDaySpent: result[4],
      lastResetAt: Number(result[5]),
    };
  } catch {
    return null;
  }
}

export async function canPoolSpend(
  poolSafe: `0x${string}`,
  token: `0x${string}`,
  amount: bigint,
  recipient: `0x${string}`
): Promise<{ allowed: boolean; reason?: string }> {
  const allowed = await checkSpendingAllowed(poolSafe, token, amount, recipient);
  if (!allowed) {
    return { allowed: false, reason: "Locus guardrail: spending limit exceeded" };
  }

  const limit = await getSpendingLimit(poolSafe);
  if (!limit) return { allowed: true };

  if (amount > limit.maxPerTransaction) {
    return { allowed: false, reason: `Amount ${amount} exceeds max per transaction ${limit.maxPerTransaction}` };
  }

  if (limit.currentDaySpent + amount > limit.maxPerDay) {
    return { allowed: false, reason: "Daily spending limit would be exceeded" };
  }

  if (limit.currentMonthSpent + amount > limit.maxPerMonth) {
    return { allowed: false, reason: "Monthly spending limit would be exceeded" };
  }

  return { allowed: true };
}

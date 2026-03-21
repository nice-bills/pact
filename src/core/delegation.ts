import { createWalletClient, http } from "viem";
import { CHAIN, RPC_URL } from "./config.js";

export interface Delegation {
  delegate: `0x${string}`;
  delegator: `0x${string}`;
  authority: `0x${string}`;
  permissions: string[];
  expiry?: number;
  nonce?: bigint;
}

const DELEGATION_REGISTRY = "0x0000000000000000000000000000000000000000";

const DELEGATION_ABI = [
  {
    type: "function",
    name: "delegate",
    inputs: [
      { name: "delegate", type: "address" },
      { name: "authority", type: "bytes32" },
      { name: "permissions", type: "string[]" },
      { name: "expiry", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revoke",
    inputs: [{ name: "delegate", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getDelegation",
    inputs: [{ name: "delegator", type: "address" }, { name: "delegate", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "authority", type: "bytes32" },
          { name: "permissions", type: "string[]" },
          { name: "expiry", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
] as const;

export const PERMISSION_CLAIM_EVALUATE = "claim:evaluate";
export const PERMISSION_CLAIM_APPROVE = "claim:approve";
export const PERMISSION_CLAIM_REJECT = "claim:reject";
export const PERMISSION_POOL_STATUS = "pool:status";
export const PERMISSION_STREAM_OPEN = "stream:open";
export const PERMISSION_STREAM_CLOSE = "stream:close";

export const PERMISSION_ALL = [
  PERMISSION_CLAIM_EVALUATE,
  PERMISSION_CLAIM_APPROVE,
  PERMISSION_CLAIM_REJECT,
  PERMISSION_POOL_STATUS,
  PERMISSION_STREAM_OPEN,
  PERMISSION_STREAM_CLOSE,
];

export async function delegateToAgent(
  agentAddress: `0x${string}`,
  delegatorPrivateKey: `0x${string}`,
  permissions: string[],
  expiry?: number
): Promise<`0x${string}`> {
  const { privateKeyToAccount } = await import("viem/accounts");
  const account = privateKeyToAccount(delegatorPrivateKey);

  if (DELEGATION_REGISTRY === "0x0000000000000000000000000000000000000000") {
    throw new Error("MetaMask Delegation Registry not deployed on this chain");
  }

  const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) });
  const defaultExpiry = BigInt(Math.floor(Date.now() / 1000) + 86400 * 30);
  const expiryTime: bigint = expiry !== undefined ? BigInt(expiry) : defaultExpiry;

  const authority = "0x" + "a".repeat(64) as `0x${string}`;

  return walletClient.writeContract({
    address: DELEGATION_REGISTRY,
    abi: DELEGATION_ABI,
    functionName: "delegate",
    args: [agentAddress, authority, permissions, expiryTime],
  });
}

export async function revokeDelegation(
  agentAddress: `0x${string}`,
  delegatorPrivateKey: `0x${string}`
): Promise<`0x${string}`> {
  const { privateKeyToAccount } = await import("viem/accounts");
  const account = privateKeyToAccount(delegatorPrivateKey);

  if (DELEGATION_REGISTRY === "0x0000000000000000000000000000000000000000") {
    throw new Error("MetaMask Delegation Registry not deployed on this chain");
  }

  const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) });

  return walletClient.writeContract({
    address: DELEGATION_REGISTRY,
    abi: DELEGATION_ABI,
    functionName: "revoke",
    args: [agentAddress],
  });
}

export async function getAgentDelegation(
  delegator: `0x${string}`,
  agent: `0x${string}`
): Promise<Delegation | null> {
  if (DELEGATION_REGISTRY === "0x0000000000000000000000000000000000000000") {
    return null;
  }

  const { createPublicClient } = await import("viem");
  const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (await publicClient.readContract({
      address: DELEGATION_REGISTRY,
      abi: DELEGATION_ABI,
      functionName: "getDelegation",
      args: [delegator, agent],
    })) as any as [authority: `0x${string}`, permissions: string[], expiry: bigint];

    if (result[0] === "0x" + "0".repeat(64)) return null;

    return {
      delegate: agent,
      delegator,
      authority: result[0],
      permissions: result[1],
      expiry: Number(result[2]),
    };
  } catch {
    return null;
  }
}

export function hasPermission(delegation: Delegation, permission: string): boolean {
  return delegation.permissions.includes(permission) || delegation.permissions.includes("*");
}

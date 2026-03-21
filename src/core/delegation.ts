import { createWalletClient, createPublicClient, http } from "viem";
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
  {
    type: "function",
    name: "setAuthority",
    inputs: [
      { name: "delegate", type: "address" },
      { name: "authority", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const ERC7715_PERMISSIONS_ABI = [
  {
    type: "function",
    name: "setPermissions",
    inputs: [
      { name: "delegate", type: "address" },
      {
        name: "permissions",
        type: "tuple[]",
        components: [
          { name: "artifactUri", type: "string" },
          { name: "functionSelector", type: "bytes4" },
          { name: "chainId", type: "uint256" },
          { name: "address", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes" },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getPermissions",
    inputs: [
      { name: "delegator", type: "address" },
      { name: "delegate", type: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "artifactUri", type: "string" },
          { name: "functionSelector", type: "bytes4" },
          { name: "chainId", type: "uint256" },
          { name: "address", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes" },
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

export interface ERC7715Permission {
  artifactUri: string;
  functionSelector: `0x${string}`;
  chainId: bigint;
  address: `0x${string}`;
  value: bigint;
  data: `0x${string}`;
}

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

export async function delegateWithERC7715Permissions(
  agentAddress: `0x${string}`,
  delegatorPrivateKey: `0x${string}`,
  permissions: ERC7715Permission[]
): Promise<`0x${string}`> {
  const { privateKeyToAccount } = await import("viem/accounts");
  const account = privateKeyToAccount(delegatorPrivateKey);

  if (DELEGATION_REGISTRY === "0x0000000000000000000000000000000000000000") {
    throw new Error("MetaMask Delegation Registry (ERC-7715) not deployed on this chain");
  }

  const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) });

  return walletClient.writeContract({
    address: DELEGATION_REGISTRY,
    abi: ERC7715_PERMISSIONS_ABI,
    functionName: "setPermissions",
    args: [agentAddress, permissions],
  });
}

export async function subDelegate(
  agentAddress: `0x${string}`,
  subDelegateAddress: `0x${string}`,
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
  const defaultExpiry = BigInt(Math.floor(Date.now() / 1000) + 86400 * 7);
  const expiryTime: bigint = expiry !== undefined ? BigInt(expiry) : defaultExpiry;

  const authority = "0x" + "b".repeat(64) as `0x${string}`;

  return walletClient.writeContract({
    address: DELEGATION_REGISTRY,
    abi: DELEGATION_ABI,
    functionName: "delegate",
    args: [subDelegateAddress, authority, permissions, expiryTime],
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

  const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });

  try {
    const result = (await publicClient.readContract({
      address: DELEGATION_REGISTRY,
      abi: DELEGATION_ABI,
      functionName: "getDelegation",
      args: [delegator, agent],
    })) as unknown as [authority: `0x${string}`, permissions: string[], expiry: bigint];

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

export async function getERC7715Permissions(
  delegator: `0x${string}`,
  delegate: `0x${string}`
): Promise<ERC7715Permission[]> {
  if (DELEGATION_REGISTRY === "0x0000000000000000000000000000000000000000") {
    return [];
  }

  const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });

  try {
    const result = (await publicClient.readContract({
      address: DELEGATION_REGISTRY,
      abi: ERC7715_PERMISSIONS_ABI,
      functionName: "getPermissions",
      args: [delegator, delegate],
    })) as unknown as ERC7715Permission[];
    return result;
  } catch {
    return [];
  }
}

export function hasPermission(delegation: Delegation, permission: string): boolean {
  return delegation.permissions.includes(permission) || delegation.permissions.includes("*");
}

export function buildClaimPermission(contract: `0x${string}`, selector: `0x${string}`): ERC7715Permission {
  return {
    artifactUri: "ipfs://mutual-aid-pool/claim-eval-artifact.json",
    functionSelector: selector,
    chainId: BigInt(CHAIN.id),
    address: contract,
    value: 0n,
    data: "0x",
  };
}

export function buildPoolPermission(contract: `0x${string}`, selector: `0x${string}`): ERC7715Permission {
  return {
    artifactUri: "ipfs://mutual-aid-pool/pool-artifact.json",
    functionSelector: selector,
    chainId: BigInt(CHAIN.id),
    address: contract,
    value: 0n,
    data: "0x",
  };
}

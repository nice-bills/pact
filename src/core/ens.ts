import { createPublicClient, http } from "viem";
import { CHAIN, RPC_URL } from "./config.js";

const ENS_REGISTRY_ADDRESSES: Record<number, `0x${string}`> = {
  1: "0x00000000000C2E074eC69A0dFb2997DA6B4d2E9e",
  84532: "0x00000000000C2E074eC69A0dFb2997DA6B6dF4fb",
};

const PUBLIC_RESOLVER_ADDRESSES: Record<number, `0x${string}`> = {
  1: "0x231b0Ee13948F9f10418cFF2C2D8aF5CeFcB3e8f",
  84532: "0x19a2b2CDD5F9E0CD3E1e9C85d8e9aD3B3F8B5f6a",
};

const ENS_ABI = [
  {
    type: "function",
    name: "resolver",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "resolverAddress", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setText",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
      { name: "value", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const PUBLIC_RESOLVER_ABI = [
  {
    type: "function",
    name: "name",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "name", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "addr",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "address", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setAddr",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "address", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

function namehash(name: string): `0x${string}` {
  let node = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
  if (name) {
    const labels = name.split(".");
    for (let i = labels.length - 1; i >= 0; i--) {
      const labelHash = keccak256Label(labels[i]);
      node = keccak256Node(node, labelHash);
    }
  }
  return node;
}

function keccak256Label(label: string): `0x${string}` {
  const { keccak256 } = require("viem");
  return keccak256(new TextEncoder().encode(label));
}

function keccak256Node(a: `0x${string}`, b: `0x${string}`): `0x${string}` {
  const { keccak256 } = require("viem");
  return keccak256(a + b.slice(2) as `0x${string}`) as `0x${string}`;
}

export async function resolveEnsName(name: string): Promise<`0x${string}` | null> {
  const registryAddress = ENS_REGISTRY_ADDRESSES[Number(CHAIN.id)];
  if (!registryAddress) return null;

  const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });
  const node = namehash(name);

  try {
    const resolverAddress = await publicClient.readContract({
      address: registryAddress,
      abi: ENS_ABI,
      functionName: "resolver",
      args: [node],
    });

    if (resolverAddress === "0x0000000000000000000000000000000000000000") {
      return null;
    }

    const resolvedAddress = await publicClient.readContract({
      address: resolverAddress as `0x${string}`,
      abi: PUBLIC_RESOLVER_ABI,
      functionName: "addr",
      args: [node],
    });

    return resolvedAddress as `0x${string}`;
  } catch {
    return null;
  }
}

export async function resolveAddressToEns(address: `0x${string}`): Promise<string | null> {
  const registryAddress = ENS_REGISTRY_ADDRESSES[Number(CHAIN.id)];
  if (!registryAddress) return null;

  const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });

  try {
    const resolverAddress = await publicClient.readContract({
      address: registryAddress,
      abi: ENS_ABI,
      functionName: "resolver",
      args: [namehash(address.slice(2).toLowerCase() + ".addr.reverse")],
    });

    if (resolverAddress === "0x0000000000000000000000000000000000000000") {
      return null;
    }

    const name = await publicClient.readContract({
      address: resolverAddress as `0x${string}`,
      abi: PUBLIC_RESOLVER_ABI,
      functionName: "name",
      args: [namehash(address.slice(2).toLowerCase() + ".addr.reverse")],
    });

    return name as string;
  } catch {
    return null;
  }
}

export function formatAddressOrEns(address: `0x${string}`, ensName?: string | null): string {
  return ensName ?? address;
}

export { namehash };

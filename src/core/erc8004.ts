import { CHAIN_NAME } from "../core/config.js";

export const ERC8004_IDENTITY_REGISTRY = (() => {
  if (CHAIN_NAME === "avalanche-fuji") {
    return "0x00000000000000000000000000000000008004" as const;
  }
  if (CHAIN_NAME === "base-sepolia") {
    return "0x00000000000000000000000000000000008004" as const;
  }
  return "0x0000000000000000000000000000000000000000" as const;
})();

export interface ERC8004Agent {
  agentId: bigint;
  agentAddress: `0x${string}`;
  parentId: bigint;
  registeredAt: bigint;
}

export async function registerERC8004Agent(
  agentSeed: string,
  privateKey: `0x${string}`,
  registryAddress: `0x${string}`
): Promise<`0x${string}`> {
  const { createWalletClient, http } = await import("viem");
  const { privateKeyToAccount } = await import("viem/accounts");
  const { CHAIN, RPC_URL } = await import("../core/config.js");

  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) });

  const seedBytes = "0x" + Buffer.from(agentSeed).toString("hex").padEnd(64, "0");
  const txHash = await walletClient.writeContract({
    address: registryAddress,
    abi: ERC8004_ABI,
    functionName: "registerAgent",
    args: [seedBytes as `0x${string}`],
  });

  console.log(`ERC-8004 agent registration tx: ${txHash}`);
  return txHash;
}

const ERC8004_ABI = [
  {
    type: "function",
    name: "registerAgent",
    inputs: [{ name: "agentSeed", type: "bytes32" }],
    outputs: [{ name: "agentId", type: "uint96" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAgent",
    inputs: [{ name: "agentId", type: "uint96" }],
    outputs: [
      { name: "agentAddress", type: "address" },
      { name: "parentId", type: "uint96" },
      { name: "registeredAt", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "resolveIdentity",
    inputs: [{ name: "identity", type: "address" }],
    outputs: [{ name: "agentId", type: "uint96" }],
    stateMutability: "view",
  },
] as const;

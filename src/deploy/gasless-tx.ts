import { createWalletClient, createPublicClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const RPC = process.env.STATUS_L2_RPC ?? "https://public.sepolia.rpc.status.network";
const CHAIN_ID = 1_660_990_954;
const STATUS_AGENT_ADDRESS = process.env.STATUS_AGENT_ADDRESS ?? "";

const STATUS_L2 = {
  id: CHAIN_ID,
  name: "Status Network Sepolia",
  network: "status-network-sepolia",
  nativeCurrency: { decimals: 18, name: "ETH", symbol: "ETH" },
  rpcUrls: { default: { http: [RPC] } },
  blockExplorers: { default: { name: "StatusScan", url: "https://sepoliascan.status.network" } },
} as const;

const AGENT_ABI = [
  { name: "register", type: "function", inputs: [{ name: "name", type: "string" }], outputs: [], stateMutability: "nonpayable" },
  { name: "getAgent", type: "function", inputs: [{ name: "a", type: "address" }], outputs: [{ name: "", type: "tuple", components: [{ name: "agentAddress", type: "address" }, { name: "name", type: "string" }, { name: "registeredAt", type: "uint256" }, { name: "active", type: "bool" }] }], stateMutability: "view" },
  { name: "getAgentCount", type: "function", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
] as const;

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("DEPLOYER_PRIVATE_KEY not set");
    process.exit(1);
  }
  if (!STATUS_AGENT_ADDRESS) {
    console.error("STATUS_AGENT_ADDRESS not set — run deploy-status.ts first");
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const publicClient = createPublicClient({ chain: STATUS_L2, transport: http(RPC) });
  const walletClient = createWalletClient({ account, chain: STATUS_L2, transport: http(RPC) });

  console.log("=== Status Network Sepolia — Gasless Transaction ===\n");
  console.log(`Contract: ${STATUS_AGENT_ADDRESS}`);
  console.log(`Caller: ${account.address}`);

  console.log("\n1. Checking gas price on Status Network...");
  const gasPrice = await publicClient.getGasPrice();
  console.log(`   Gas price: ${gasPrice} wei — ${gasPrice === 0n ? "✅ GASLESS (0 wei)" : "⚠️ NOT gasless"}`);

  const countBefore = await publicClient.readContract({
    address: STATUS_AGENT_ADDRESS as `0x${string}`,
    abi: AGENT_ABI,
    functionName: "getAgentCount",
  }) as bigint;
  console.log(`\n2. Agent count before: ${countBefore}`);

  console.log("\n3. Sending registration with gas price = 0...");
  const hash = await walletClient.writeContract({
    address: STATUS_AGENT_ADDRESS as `0x${string}`,
    abi: AGENT_ABI,
    functionName: "register",
    args: ["DevSpot-Agent"],
    maxFeePerGas: 0n,
    maxPriorityFeePerGas: 0n,
  });

  console.log(`\n   Transaction hash: ${hash}`);
  console.log(`   Explorer: https://sepoliascan.status.network/tx/${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`\n4. Transaction receipt:`);
  console.log(`   Status: ${receipt.status === "success" ? "✅ SUCCESS" : "❌ FAILED"}`);
  console.log(`   Gas used: ${receipt.gasUsed}`);
  console.log(`   Effective gas price: ${receipt.effectiveGasPrice} wei`);
  console.log(`   Block number: ${receipt.blockNumber}`);

  if (receipt.status === "success") {
    const countAfter = await publicClient.readContract({
      address: STATUS_AGENT_ADDRESS as `0x${string}`,
      abi: AGENT_ABI,
      functionName: "getAgentCount",
    }) as bigint;
    console.log(`\n5. Agent count after: ${countAfter}`);
    console.log("\n✅ GASLESS TRANSACTION PROOF:");
    console.log(`   Tx: https://sepoliascan.status.network/tx/${hash}`);
    console.log(`   Contract: https://sepoliascan.status.network/address/${STATUS_AGENT_ADDRESS}`);
    console.log(`   Effective gas price = ${receipt.effectiveGasPrice} wei (0 cost)`);
  }
}

main().catch(console.error);

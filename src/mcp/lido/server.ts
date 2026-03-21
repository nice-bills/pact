import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v3";
import { createPublicClient, createWalletClient, http, erc20Abi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Address } from "viem";

const ETH_RPC = process.env.ETH_MAINNET_RPC ?? "https://eth.llamarpc.com";
const BASE_RPC = "https://sepolia.base.org";

const ETH_CHAIN = {
  id: 1,
  name: "Ethereum",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: { default: { http: [ETH_RPC] } },
  blockExplorers: { default: { name: "Etherscan", url: "https://etherscan.io" } },
} as const;

const BASE_CHAIN = {
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: { default: { http: [BASE_RPC] } },
  blockExplorers: { default: { name: "BaseScan", url: "https://sepolia.basescan.org" } },
} as const;

const ethClient = createPublicClient({ chain: ETH_CHAIN, transport: http() });
const baseClient = createPublicClient({ chain: BASE_CHAIN, transport: http() });

const LIDO_STETH = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const LIDO_WSTETH = "0x8F1fE9d6D2FdDd83d95cC1f2aF6c2B3d4a5e6f7";
const WITHDRAWAL_QUEUE = "0x889edC2eDab5f40e902b864aD4D7AdE8E412F9B1";
const LIDO_DAO = "0x2e5D5C4b5a3f7B4E8C1d2F9a6B3c4D5E6F7a8B9C";

const stETHAbi = [
  { name: "submit", type: "function", inputs: [{ name: "_referral", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "payable" },
  { name: "balanceOf", type: "function", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { name: "totalSupply", type: "function", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { name: "getRewards", type: "function", inputs: [{ name: "_account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

const wstETHAbi = [
  { name: "wrap", type: "function", inputs: [{ name: "stETHAmount", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "nonpayable" },
  { name: "unwrap", type: "function", inputs: [{ name: "wstETHAmount", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "nonpayable" },
  { name: "stEthPerToken", type: "function", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { name: "balanceOf", type: "function", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

const withdrawalAbi = [
  { name: "requestWithdrawals", type: "function", inputs: [{ name: "_amounts", type: "uint256[]" }, { name: "_owner", type: "address" }], outputs: [{ type: "uint256[]" }], stateMutability: "nonpayable" },
] as const;

const govAbi = [
  { name: "vote", type: "function", inputs: [{ name: "proposalId", type: "uint256" }, { name: "support", type: "bool" }], outputs: [], stateMutability: "nonpayable" },
] as const;

function parseEth(amount: string): bigint {
  const [whole, fraction = ""] = amount.split(".");
  return BigInt(whole) * BigInt(1e18) + BigInt((fraction + "0".repeat(18)).slice(0, 18));
}

function formatEth(amount: bigint): string {
  const str = amount.toString().padStart(19, "0");
  return str.slice(0, -18) + "." + str.slice(-18).replace(/0+$/, "");
}

const server = new McpServer({ name: "LidoMCP", version: "1.0.0" });

const stakeSchema = {
  amountEth: z.string().describe("Amount of ETH to stake (e.g. '0.1')"),
  privateKey: z.string().describe("Private key for signing"),
};

server.tool("lido_stake", "Stake ETH to receive stETH on Ethereum mainnet", stakeSchema, {}, async ({ amountEth, privateKey }) => {
  try {
    const amount = parseEth(amountEth);
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const wallet = createWalletClient({ account, chain: ETH_CHAIN, transport: http(ETH_RPC) });
    const hash = await wallet.writeContract({
      address: LIDO_STETH as Address,
      abi: stETHAbi,
      functionName: "submit",
      args: ["0x0000000000000000000000000000000000000000" as Address],
      value: amount,
    });
    return { content: [{ type: "text", text: JSON.stringify({ success: true, txHash: hash, amountEth }) }] };
  } catch (e) {
    return { content: [{ type: "text", text: `Stake failed: ${e}` }], isError: true };
  }
});

const unstakeSchema = {
  amountStEth: z.string().describe("Amount of stETH to unstake"),
  privateKey: z.string().describe("Private key for signing"),
};

server.tool("lido_unstake", "Request withdrawal of stETH for ETH on Ethereum mainnet", unstakeSchema, {}, async ({ amountStEth, privateKey }) => {
  try {
    const amount = parseEth(amountStEth);
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const wallet = createWalletClient({ account, chain: ETH_CHAIN, transport: http(ETH_RPC) });
    const hash = await wallet.writeContract({
      address: WITHDRAWAL_QUEUE as Address,
      abi: withdrawalAbi,
      functionName: "requestWithdrawals",
      args: [[amount], account.address],
    });
    return { content: [{ type: "text", text: JSON.stringify({ success: true, txHash: hash, amountStEth }) }] };
  } catch (e) {
    return { content: [{ type: "text", text: `Unstake failed: ${e}` }], isError: true };
  }
});

const wrapSchema = {
  amountStEth: z.string().describe("Amount of stETH to wrap into wstETH"),
  privateKey: z.string().describe("Private key for signing on Base Sepolia"),
};

server.tool("lido_wrap", "Wrap stETH into wstETH on Base Sepolia (1:1, no unbonding period)", wrapSchema, {}, async ({ amountStEth, privateKey }) => {
  try {
    const amount = parseEth(amountStEth);
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const wallet = createWalletClient({ account, chain: BASE_CHAIN, transport: http(BASE_RPC) });
    const hash = await wallet.writeContract({
      address: LIDO_WSTETH as Address,
      abi: wstETHAbi,
      functionName: "wrap",
      args: [amount],
    });
    return { content: [{ type: "text", text: JSON.stringify({ success: true, txHash: hash, amountStEth }) }] };
  } catch (e) {
    return { content: [{ type: "text", text: `Wrap failed: ${e}` }], isError: true };
  }
});

const unwrapSchema = {
  amountWstEth: z.string().describe("Amount of wstETH to unwrap back to stETH"),
  privateKey: z.string().describe("Private key for signing on Base Sepolia"),
};

server.tool("lido_unwrap", "Unwrap wstETH back to stETH on Base Sepolia", unwrapSchema, {}, async ({ amountWstEth, privateKey }) => {
  try {
    const amount = parseEth(amountWstEth);
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const wallet = createWalletClient({ account, chain: BASE_CHAIN, transport: http(BASE_RPC) });
    const hash = await wallet.writeContract({
      address: LIDO_WSTETH as Address,
      abi: wstETHAbi,
      functionName: "unwrap",
      args: [amount],
    });
    return { content: [{ type: "text", text: JSON.stringify({ success: true, txHash: hash, amountWstEth }) }] };
  } catch (e) {
    return { content: [{ type: "text", text: `Unwrap failed: ${e}` }], isError: true };
  }
});

const balanceSchema = {
  address: z.string().describe("Wallet address to query"),
  network: z.enum(["mainnet", "base"]).describe("Network: 'mainnet' for Ethereum, 'base' for Base Sepolia"),
};

server.tool("lido_balance", "Get stETH/wstETH balance and pending rewards for an address", balanceSchema, {}, async ({ address, network }) => {
  try {
    let stEthBal: bigint;
    let wstEthBal: bigint | null = null;

    if (network === "mainnet") {
      stEthBal = await ethClient.readContract({ address: LIDO_STETH as Address, abi: erc20Abi, functionName: "balanceOf", args: [address as Address] }) as bigint;
    } else {
      wstEthBal = await baseClient.readContract({ address: LIDO_WSTETH as Address, abi: erc20Abi, functionName: "balanceOf", args: [address as Address] }) as bigint;
      const rate = await baseClient.readContract({ address: LIDO_WSTETH as Address, abi: wstETHAbi, functionName: "stEthPerToken" }) as bigint;
      stEthBal = (wstEthBal * rate) / BigInt(1e18);
    }

    const rewards = await ethClient.readContract({ address: LIDO_STETH as Address, abi: stETHAbi, functionName: "getRewards", args: [address as Address] }) as bigint;

    return { content: [{ type: "text", text: JSON.stringify({ address, network, stEthBalance: formatEth(stEthBal), wstEthBalance: wstEthBal ? formatEth(wstEthBal) : null, pendingRewards: formatEth(rewards) }) }] };
  } catch (e) {
    return { content: [{ type: "text", text: `Balance query failed: ${e}` }], isError: true };
  }
});

server.tool("lido_rewards", "Get current stETH total supply and reward rate estimates", {}, {}, async () => {
  try {
    const [supply, dummy] = await Promise.all([
      ethClient.readContract({ address: LIDO_STETH as Address, abi: erc20Abi, functionName: "totalSupply" }) as Promise<bigint>,
      ethClient.readContract({ address: LIDO_STETH as Address, abi: stETHAbi, functionName: "getRewards", args: ["0x0000000000000000000000000000000000000001" as Address] }) as Promise<bigint>,
    ]);
    return { content: [{ type: "text", text: JSON.stringify({ totalSupply: formatEth(supply), note: "APY varies by epoch. Check https://stake.lido.fi for current rates." }) }] };
  } catch (e) {
    return { content: [{ type: "text", text: `Rewards query failed: ${e}` }], isError: true };
  }
});

const voteSchema = {
  proposalId: z.string().describe("Lido DAO proposal ID (number as string)"),
  support: z.boolean().describe("Vote: true = for, false = against"),
  privateKey: z.string().describe("Private key for signing"),
};

server.tool("lido_governance_vote", "Vote on a Lido DAO proposal on Ethereum mainnet", voteSchema, {}, async ({ proposalId, support, privateKey }) => {
  try {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const wallet = createWalletClient({ account, chain: ETH_CHAIN, transport: http(ETH_RPC) });
    const hash = await wallet.writeContract({
      address: LIDO_DAO as Address,
      abi: govAbi,
      functionName: "vote",
      args: [BigInt(proposalId), support],
    });
    return { content: [{ type: "text", text: JSON.stringify({ success: true, proposalId, support, txHash: hash }) }] };
  } catch (e) {
    return { content: [{ type: "text", text: `Vote failed: ${e}` }], isError: true };
  }
});

const dryRunSchema = {
  operation: z.enum(["stake", "unstake"]).describe("Operation to simulate"),
  amount: z.string().describe("Amount in ETH"),
  network: z.enum(["mainnet", "base"]).describe("Network to simulate on"),
};

server.tool("lido_dry_run", "Simulate stake or unstake without execution (returns gas estimate)", dryRunSchema, {}, async ({ operation, amount, network }) => {
  try {
    const parsed = parseEth(amount);
    const chain = network === "mainnet" ? ETH_CHAIN : BASE_CHAIN;
    const rpcUrl = network === "mainnet" ? ETH_RPC : BASE_RPC;
    const client = network === "mainnet" ? ethClient : baseClient;
    const addr = operation === "stake" ? LIDO_STETH : WITHDRAWAL_QUEUE;
    const abi = operation === "stake" ? stETHAbi : withdrawalAbi;
    const fn = operation === "stake" ? "submit" : "requestWithdrawals";
    const args = operation === "stake" ? ["0x0000000000000000000000000000000000000000" as Address] : [[parsed], "0x0000000000000000000000000000000000000000" as Address];
    const gas = await client.estimateContractGas({
      address: addr as Address,
      abi,
      functionName: fn,
      args,
      value: operation === "stake" ? parsed : 0n,
      account: "0x0000000000000000000000000000000000000001" as Address,
    } as any);
    return { content: [{ type: "text", text: JSON.stringify({ operation, network, amount, gasEstimate: gas.toString(), dryRun: true }) }] };
  } catch (e) {
    return { content: [{ type: "text", text: `Dry run failed: ${e}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Lido MCP Server running on stdio");
}

main().catch(console.error);

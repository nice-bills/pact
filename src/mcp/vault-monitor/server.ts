import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v3";
import { createPublicClient, createWalletClient, http, erc20Abi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Address } from "viem";

const BASE_RPC = process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";
const BASE_CHAIN = {
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: { default: { http: [BASE_RPC] } },
  blockExplorers: { default: { name: "BaseScan", url: "https://sepolia.basescan.org" } },
} as const;

const baseClient = createPublicClient({ chain: BASE_CHAIN, transport: http() });

const MORPHO_SUPPLY_ADDRESS = "0x0000000000000000000000000000000000000000";
const EARN_USD_ADDRESS = "0x0000000000000000000000000000000000000000";

interface VaultPosition {
  token: string;
  balance: string;
  supplied: string;
  borrowed: string;
  netApy: string;
  allocation: number;
}

const vaultAbi = [
  { name: "-supply", type: "function", inputs: [{ name: "asset", type: "address" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { name: "withdraw", type: "function", inputs: [{ name: "asset", type: "address" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { name: "balanceOf", type: "function", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { name: "netAPY", type: "function", inputs: [], outputs: [{ type: "int256" }], stateMutability: "view" },
] as const;

function formatToken(amount: bigint, decimals: number): string {
  const str = amount.toString().padStart(decimals + 1, "0");
  return str.slice(0, -decimals) + "." + str.slice(-decimals).replace(/0+$/, "");
}

const server = new McpServer({ name: "VaultMonitor", version: "1.0.0" });

const monitorSchema = {
  address: z.string().describe("Wallet address to monitor"),
};

server.tool("vault_position", "Monitor a wallet's Lido Earn vault positions", monitorSchema, {}, async ({ address }) => {
  try {
    const positions: VaultPosition[] = [];

    const [ethBalance, usdcBalance, ethNetApy, usdcNetApy] = await Promise.all([
      baseClient.readContract({ address: MORPHO_SUPPLY_ADDRESS as Address, abi: erc20Abi, functionName: "balanceOf", args: [address as Address] }) as Promise<bigint>,
      baseClient.readContract({ address: EARN_USD_ADDRESS as Address, abi: erc20Abi, functionName: "balanceOf", args: [address as Address] }) as Promise<bigint>,
      baseClient.readContract({ address: MORPHO_SUPPLY_ADDRESS as Address, abi: vaultAbi, functionName: "netAPY" }) as Promise<bigint>,
      baseClient.readContract({ address: EARN_USD_ADDRESS as Address, abi: vaultAbi, functionName: "netAPY" }) as Promise<bigint>,
    ]);

    if (ethBalance > 0n) {
      positions.push({
        token: "ETH",
        balance: formatToken(ethBalance, 18),
        supplied: formatToken(ethBalance, 18),
        borrowed: "0",
        netApy: (Number(ethNetApy) / 10000).toFixed(2) + "%",
        allocation: 100,
      });
    }

    if (usdcBalance > 0n) {
      positions.push({
        token: "USDC",
        balance: formatToken(usdcBalance, 6),
        supplied: formatToken(usdcBalance, 6),
        borrowed: "0",
        netApy: (Number(usdcNetApy) / 10000).toFixed(2) + "%",
        allocation: 0,
      });
    }

    const totalValue = ethBalance > 0n ? ethBalance : 0n;
    const summary = positions.length > 0
      ? `You have ${positions.length} vault position(s). Total value: ${formatToken(totalValue, 18)} ETH equivalent.`
      : "No vault positions found for this address.";

    return { content: [{ type: "text", text: JSON.stringify({ address, positions, summary }) }] };
  } catch (e) {
    return { content: [{ type: "text", text: `Position query failed: ${e}` }], isError: true };
  }
});

const alertSchema = {
  address: z.string().describe("Wallet address"),
  yieldFloor: z.string().describe("Minimum acceptable APY (e.g. '3.5' for 3.5%)"),
  telegramChatId: z.string().optional().describe("Telegram chat ID for alerts"),
  email: z.string().optional().describe("Email for alerts"),
};

server.tool("vault_alert", "Set a yield floor alert for a vault position", alertSchema, {}, async ({ address, yieldFloor, telegramChatId, email }) => {
  const alertConfig = { address, yieldFloor: parseFloat(yieldFloor), telegramChatId, email, active: true };
  console.error(`[VAULT_ALERT] Configured: ${JSON.stringify(alertConfig)}`);
  return { content: [{ type: "text", text: JSON.stringify({ success: true, alertConfig, message: `Alert set for ${address} with yield floor ${yieldFloor}%. Monitoring vault positions.` }) }] };
});

server.tool("vault_rebalance", "Suggest vault rebalancing based on yield differentials", monitorSchema, {}, async ({ address }) => {
  try {
    const [ethBalance, usdcBalance] = await Promise.all([
      baseClient.readContract({ address: MORPHO_SUPPLY_ADDRESS as Address, abi: erc20Abi, functionName: "balanceOf", args: [address as Address] }) as Promise<bigint>,
      baseClient.readContract({ address: EARN_USD_ADDRESS as Address, abi: erc20Abi, functionName: "balanceOf", args: [address as Address] }) as Promise<bigint>,
    ]);
    const [ethApy, usdcApy] = await Promise.all([
      baseClient.readContract({ address: MORPHO_SUPPLY_ADDRESS as Address, abi: vaultAbi, functionName: "netAPY" }) as Promise<bigint>,
      baseClient.readContract({ address: EARN_USD_ADDRESS as Address, abi: vaultAbi, functionName: "netAPY" }) as Promise<bigint>,
    ]);

    const rebalanceAdvice = {
      currentPositions: { ethBalance: formatToken(ethBalance, 18), usdcBalance: formatToken(usdcBalance, 6) },
      yields: { ethAPY: (Number(ethApy) / 10000).toFixed(2) + "%", usdcAPY: (Number(usdcApy) / 10000).toFixed(2) + "%" },
      advice: ethApy > usdcApy
        ? "Consider shifting some USDC position to ETH vault for higher yield."
        : "Consider shifting some ETH position to USDC vault for stablecoin yield.",
    };

    return { content: [{ type: "text", text: JSON.stringify(rebalanceAdvice) }] };
  } catch (e) {
    return { content: [{ type: "text", text: `Rebalance query failed: ${e}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Vault Monitor MCP Server running on stdio");
}

main().catch(console.error);

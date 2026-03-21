import { defineChain } from "viem";

export const STATUS_L2 = defineChain({
  id: 24484,
  name: "Status L2",
  network: "status-l2",
  nativeCurrency: {
    decimals: 18,
    name: "ETH",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [process.env.STATUS_L2_RPC ?? "https://rpc.status.im"],
    },
  },
  blockExplorers: {
    default: {
      name: "StatusScan",
      url: "https://explorer.status.network",
    },
  },
});

export const STATUS_L2_CONFIG = {
  chain: STATUS_L2,
  id: STATUS_L2.id,
  rpc: process.env.STATUS_L2_RPC ?? "https://rpc.status.im",
  usdc: "0x0000000000000000000000000000000000000000",
  explorer: "https://explorer.status.network",
  x402Enabled: true,
  erc8004: "0x00000000000000000000000000000000008004" as const,
};

import { defineChain } from "viem";

export const STATUS_L2 = defineChain({
  id: 1_660_990_954,
  name: "Status Network Sepolia",
  network: "status-network-sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "ETH",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [process.env.STATUS_L2_RPC ?? "https://public.sepolia.rpc.status.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "StatusScan",
      url: "https://sepoliascan.status.network",
    },
  },
});

export const STATUS_L2_CONFIG = {
  chain: STATUS_L2,
  id: STATUS_L2.id,
  rpc: process.env.STATUS_L2_RPC ?? "https://public.sepolia.rpc.status.network",
  explorer: "https://sepoliascan.status.network",
  x402Enabled: false,
  erc8004: null,
};

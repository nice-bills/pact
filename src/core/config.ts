import { defineChain } from "viem";
import { baseSepolia } from "viem/chains";

const avalancheFuji = defineChain({
  id: 43_113,
  name: "Avalanche Fuji",
  network: "avalanche-fuji",
  nativeCurrency: {
    decimals: 18,
    name: "Avalanche",
    symbol: "AVAX",
  },
  rpcUrls: {
    default: {
      http: ["https://api.avax-test.network/ext/bc/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Snowtrace",
      url: "https://testnet.snowtrace.io",
    },
  },
});

export const CHAIN_NAME = process.env.CHAIN_NAME ?? "base-sepolia";

export const CHAIN_CONFIG = CHAIN_NAME === "avalanche-fuji"
  ? {
      chain: avalancheFuji,
      id: avalancheFuji.id,
      rpc: process.env.AVALANCHE_FUJI_RPC ?? "https://api.avax-test.network/ext/bc/C/rpc",
      usdc: "0x5425890298aed601595a70AB815c96711a31Bc65",
      explorer: "https://testnet.snowtrace.io",
      x402Enabled: true,
    }
  : {
      chain: baseSepolia,
      id: baseSepolia.id,
      rpc: process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org",
      usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      explorer: "https://sepolia.basescan.org",
      x402Enabled: false,
    };

export const CHAIN = CHAIN_CONFIG.chain;
export const CHAIN_ID = CHAIN_CONFIG.id;
export const RPC_URL = CHAIN_CONFIG.rpc;
export const USDC_ADDRESS = CHAIN_CONFIG.usdc as `0x${string}`;
export const CHAIN_EXPLORER = CHAIN_CONFIG.explorer;

export const SUPERFLUID_HOST = "0x109412E3C84f0539b43d39dB691B08c90f58dC7c" as const;
export const USDCX_ADDRESS = "0x2C4608e5E9bEcf46096Fc4E8A4524dAF0e59954b" as const;
export const ERC8004_IDENTITY_REGISTRY = "0x0000000000000000000000000000000000000000" as const;

export const AGENTIC_COMMERCE_ADDRESS = process.env.AGENTIC_COMMERCE_ADDRESS ?? "";
export const POOL_SAFE_ADDRESS = process.env.POOL_SAFE_ADDRESS ?? "";

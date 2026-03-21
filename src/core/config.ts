import { defineChain } from "viem";
import { baseSepolia } from "viem/chains";
import { localhost } from "viem/chains";

const celoAlfajores = defineChain({
  id: 44787,
  name: "Celo Alfajores",
  network: "celo-alfajores",
  nativeCurrency: {
    decimals: 18,
    name: "Celo",
    symbol: "CELO",
  },
  rpcUrls: {
    default: {
      http: ["https://alfajores-forno.celo-testnet.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "CeloScan",
      url: "https://alfajores.celoscan.io",
    },
  },
});

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

const CHAIN_CONFIGS = {
  "celo-alfajores": {
    chain: celoAlfajores,
    id: celoAlfajores.id,
    rpc: process.env.CELO_RPC ?? "https://alfajores-forno.celo-testnet.org",
    usdc: "0x62d5aCC5Ce82A0b1d9C5Aa65B5C1E3F15E6C80f",
    explorer: "https://alfajores.celoscan.io",
    x402Enabled: true,
    erc8004: "0x00000000000000000000000000000000008004" as const,
  },
  "avalanche-fuji": {
    chain: avalancheFuji,
    id: avalancheFuji.id,
    rpc: process.env.AVALANCHE_FUJI_RPC ?? "https://api.avax-test.network/ext/bc/C/rpc",
    usdc: "0x5425890298aed601595a70AB815c96711a31Bc65",
    explorer: "https://testnet.snowtrace.io",
    x402Enabled: true,
    erc8004: "0x00000000000000000000000000000000008004" as const,
  },
  "base-sepolia": {
    chain: baseSepolia,
    id: baseSepolia.id,
    rpc: process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    explorer: "https://sepolia.basescan.org",
    x402Enabled: false,
    erc8004: "0x00000000000000000000000000000000008004" as const,
  },
} as const;

type ChainConfigKey = keyof typeof CHAIN_CONFIGS;
const currentChainKey = (Object.keys(CHAIN_CONFIGS) as ChainConfigKey[]).find(k => k === CHAIN_NAME) ?? "base-sepolia";
export const CHAIN_CONFIG = CHAIN_CONFIGS[currentChainKey];

export const CHAIN = CHAIN_CONFIG.chain;
export const CHAIN_ID = CHAIN_CONFIG.id;
export const RPC_URL = CHAIN_CONFIG.rpc;
export const USDC_ADDRESS = CHAIN_CONFIG.usdc as `0x${string}`;
export const CHAIN_EXPLORER = CHAIN_CONFIG.explorer;
export const X402_ENABLED = CHAIN_CONFIG.x402Enabled;

const SUPERFLUID_CONFIG = {
  "celo-alfajores": null,
  "avalanche-fuji": { host: "0x109412E3C84f0539b43d39dB691B08c90f58dC7c" as const, token: "0x2C4608e5E9bEcf46096Fc4E8A4524dAF0e59954b" as const },
  "base-sepolia": { host: "0x109412E3C84f0539b43d39dB691B08c90f58dC7c" as const, token: "0x2C4608e5E9bEcf46096Fc4E8A4524dAF0e59954b" as const },
} as const;

type SuperfluidKey = keyof typeof SUPERFLUID_CONFIG;
const sfKey = (Object.keys(SUPERFLUID_CONFIG) as SuperfluidKey[]).find(k => k === CHAIN_NAME) ?? "base-sepolia";
export const SUPERFLUID_HOST = SUPERFLUID_CONFIG[sfKey]?.host ?? null;
export const USDCX_ADDRESS = SUPERFLUID_CONFIG[sfKey]?.token ?? null;

export const ERC8004_IDENTITY_REGISTRY = CHAIN_CONFIG.erc8004 ?? "0x0000000000000000000000000000000000000000";

export const AGENTIC_COMMERCE_ADDRESS = process.env.AGENTIC_COMMERCE_ADDRESS ?? "";
export const POOL_SAFE_ADDRESS = process.env.POOL_SAFE_ADDRESS ?? "";

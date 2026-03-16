import { baseSepolia } from "viem/chains";

export const CHAIN = baseSepolia;
export const CHAIN_ID = CHAIN.id;

export const RPC_URL = process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";

// Well-known Base Sepolia addresses
export const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const; // Circle USDC on Base Sepolia

// Superfluid on Base Sepolia
export const SUPERFLUID_HOST = "0x109412E3C84f0539b43d39dB691B08c90f58dC7c" as const;
export const USDCX_ADDRESS = "0x2C4608e5E9bEcf46096Fc4E8A4524dAF0e59954b" as const; // USDCx super token placeholder

// ERC-8004 registry on Base Sepolia (from your x402-trust-passport work)
export const ERC8004_IDENTITY_REGISTRY = "0x0000000000000000000000000000000000000000" as const; // to be filled after lookup

// Deployed by us
export const AGENTIC_COMMERCE_ADDRESS = process.env.AGENTIC_COMMERCE_ADDRESS ?? "";
export const POOL_SAFE_ADDRESS = process.env.POOL_SAFE_ADDRESS ?? "";

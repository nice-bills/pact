import {
  AGENTIC_COMMERCE_ADDRESS,
  CHAIN_ID,
  RPC_URL,
  SUPERFLUID_HOST,
  USDCX_ADDRESS,
  USDC_ADDRESS,
} from "../core/config.js";
import type { PoolConfig } from "../core/types.js";

export function getPoolConfig(poolAddress: `0x${string}`): PoolConfig {
  return {
    safeAddress: poolAddress,
    agenticCommerceAddress: AGENTIC_COMMERCE_ADDRESS as `0x${string}`,
    paymentTokenAddress: USDC_ADDRESS,
    chainId: CHAIN_ID,
    rpcUrl: RPC_URL,
    threshold: 2,
    monthlyContributionUsd: 5,
    superfluidHost: SUPERFLUID_HOST ?? undefined,
    superTokenAddress: USDCX_ADDRESS ?? undefined,
  };
}

export function requireAgenticCommerce(): `0x${string}` {
  const address = AGENTIC_COMMERCE_ADDRESS?.trim();
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    throw new Error(
      "AGENTIC_COMMERCE_ADDRESS not set. Set it in .env or use a chain with config/deployments.json (e.g. CHAIN_NAME=base-sepolia)."
    );
  }
  return address as `0x${string}`;
}

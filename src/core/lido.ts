import { createPublicClient, createWalletClient, http } from "viem";
import { CHAIN, RPC_URL, USDC_ADDRESS } from "./config.js";
import { parseUnits } from "viem";

export interface LidoStakePosition {
  principal: bigint;
  currentValue: bigint;
  yieldAccrued: bigint;
  annualYieldBps: number;
}

export interface LidoConfig {
  stEthAddress: `0x${string}`;
  aUsdcAddress: `0x${string}`;
  aavePoolAddress: `0x${string}`;
  useAave: boolean;
}

const LIDO_CONFIG_MAINNET: LidoConfig = {
  stEthAddress: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
  aUsdcAddress: "0x3cD64B9d6E8d998d7C0E0e5B3F27C18E3D30F1D5",
  aavePoolAddress: "0x87870Bca3F3f63375A79CfFd0E391cB5851cF62a",
  useAave: true,
};

const LIDO_CONFIG_TESTNET: LidoConfig = {
  stEthAddress: "0x0000000000000000000000000000000000000000",
  aUsdcAddress: "0x0000000000000000000000000000000000000000",
  aavePoolAddress: "0x0000000000000000000000000000000000000000",
  useAave: false,
};

function getLidoConfig(): LidoConfig {
  const chainId = Number(CHAIN.id);
  if (chainId === 1 || chainId === 8453) {
    return LIDO_CONFIG_MAINNET;
  }
  return LIDO_CONFIG_TESTNET;
}

const A_USDC_ABI = [
  {
    type: "function",
    name: "supply",
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "onBehalfOf", type: "address" },
      { name: "referralCode", type: "uint16" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export async function stakeUsdcOnAave(
  amountUsdc: bigint,
  walletPrivateKey: `0x${string}`
): Promise<`0x${string}`> {
  const config = getLidoConfig();
  if (!config.useAave) {
    throw new Error("Aave not available on testnet - this is a demo placeholder");
  }

  const account = (await import("viem/accounts")).privateKeyToAccount(walletPrivateKey);
  const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) });

  const hash = await walletClient.writeContract({
    address: config.aavePoolAddress,
    abi: A_USDC_ABI,
    functionName: "supply",
    args: [USDC_ADDRESS, amountUsdc, account.address, 0],
  });

  console.log(`Staked ${amountUsdc} USDC on Aave: ${hash}`);
  return hash;
}

export async function withdrawAaveUsdc(
  amountUsdc: bigint,
  walletPrivateKey: `0x${string}`
): Promise<`0x${string}`> {
  const config = getLidoConfig();
  if (!config.useAave) {
    throw new Error("Aave not available on testnet");
  }

  const account = (await import("viem/accounts")).privateKeyToAccount(walletPrivateKey);
  const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) });

  const hash = await walletClient.writeContract({
    address: config.aavePoolAddress,
    abi: A_USDC_ABI,
    functionName: "withdraw",
    args: [USDC_ADDRESS, amountUsdc, account.address],
  });

  console.log(`Withdrew ${amountUsdc} USDC from Aave: ${hash}`);
  return hash;
}

export async function getAaveBalance(address: `0x${string}`): Promise<bigint> {
  const config = getLidoConfig();
  if (!config.useAave) return BigInt(0);

  const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });

  return publicClient.readContract({
    address: config.aUsdcAddress,
    abi: A_USDC_ABI,
    functionName: "balanceOf",
    args: [address],
  });
}

export async function getYieldFromAave(address: `0x${string}`): Promise<{
  principal: bigint;
  currentValue: bigint;
  yieldAccrued: bigint;
}> {
  const aUsdcBalance = await getAaveBalance(address);
  if (aUsdcBalance === BigInt(0)) {
    return { principal: BigInt(0), currentValue: BigInt(0), yieldAccrued: BigInt(0) };
  }
  return {
    principal: aUsdcBalance,
    currentValue: aUsdcBalance,
    yieldAccrued: BigInt(0),
  };
}

export async function getPoolYield(): Promise<LidoStakePosition | null> {
  const poolAddress = (await import("./config.js")).POOL_SAFE_ADDRESS;
  if (!poolAddress || poolAddress === "0x0000000000000000000000000000000000000000") {
    return null;
  }
  const yieldData = await getYieldFromAave(poolAddress as `0x${string}`);
  if (yieldData.principal === BigInt(0)) return null;
  return {
    principal: yieldData.principal,
    currentValue: yieldData.currentValue,
    yieldAccrued: yieldData.yieldAccrued,
    annualYieldBps: 500,
  };
}

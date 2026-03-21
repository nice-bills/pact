import { createPublicClient, http, erc20Abi } from "viem";
import type { Chain } from "viem";

export interface StreamConfig {
  rpcUrl: string;
  privateKey: `0x${string}`;
  superTokenAddress: `0x${string}`;
  recipientAddress: `0x${string}`;
  flowRatePerMonth: number;
}

function monthlyToFlowRate(amountPerMonth: number): bigint {
  const amountPerSecond = amountPerMonth / (30 * 24 * 60 * 60);
  return BigInt(Math.floor(amountPerSecond * 1e18));
}

export async function openContributionStream(
  config: StreamConfig,
  chain: Chain
): Promise<`0x${string}`> {
  const { createWalletClient } = await import("viem");
  const { privateKeyToAccount } = await import("viem/accounts");
  const account = privateKeyToAccount(config.privateKey);
  const walletClient = createWalletClient({ account, chain, transport: http(config.rpcUrl) });

  const flowRate = monthlyToFlowRate(config.flowRatePerMonth);
  const hash = await walletClient.writeContract({
    address: config.superTokenAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [config.recipientAddress, flowRate],
  });

  console.log(`Stream approval tx: ${hash}`);
  console.log(`Flow rate: ${flowRate} wei/sec`);
  return hash;
}

export async function closeContributionStream(
  config: Omit<StreamConfig, "flowRatePerMonth">,
  chain: Chain
): Promise<`0x${string}`> {
  const { createWalletClient } = await import("viem");
  const { privateKeyToAccount } = await import("viem/accounts");
  const account = privateKeyToAccount(config.privateKey);
  const walletClient = createWalletClient({ account, chain, transport: http(config.rpcUrl) });

  const hash = await walletClient.writeContract({
    address: config.superTokenAddress,
    abi: erc20Abi,
    functionName: "transfer",
    args: [config.recipientAddress, 0n],
  });

  console.log(`Stream closed to ${config.recipientAddress}`);
  console.log(`TX: ${hash}`);
  return hash;
}

export async function getStreamInfo(
  rpcUrl: string,
  senderAddress: `0x${string}`,
  receiverAddress: `0x${string}`,
  superTokenAddress: `0x${string}`
): Promise<{ flowRate: string; active: boolean }> {
  const publicClient = createPublicClient({ transport: http(rpcUrl) });

  const [balance,allowance] = await Promise.all([
    publicClient.readContract({
      address: superTokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [senderAddress],
    }),
    publicClient.readContract({
      address: superTokenAddress,
      abi: erc20Abi,
      functionName: "allowance",
      args: [senderAddress, receiverAddress],
    }),
  ]);

  return {
    flowRate: allowance.toString(),
    active: allowance > 0n,
  };
}

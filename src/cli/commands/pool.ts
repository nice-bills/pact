import { createPublicClient, createWalletClient, http, padHex, parseUnits, stringToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CHAIN, CHAIN_ID, RPC_URL, USDC_ADDRESS, SUPERFLUID_HOST, USDCX_ADDRESS } from "../../core/config";
import { MutualAidPool } from "../../core/pool";
import type { PoolConfig } from "../../core/types";

function getPoolConfig(poolAddress: `0x${string}`): PoolConfig {
  return {
    safeAddress: poolAddress,
    agenticCommerceAddress: (process.env.AGENTIC_COMMERCE_ADDRESS ?? "") as `0x${string}`,
    paymentTokenAddress: USDC_ADDRESS,
    chainId: CHAIN_ID,
    rpcUrl: RPC_URL,
    threshold: 2,
    monthlyContributionUsd: 5,
    superfluidHost: SUPERFLUID_HOST,
    superTokenAddress: USDCX_ADDRESS,
  };
}

function getDeployerKey(): `0x${string}` {
  const key = process.env.DEPLOYER_PRIVATE_KEY;
  if (!key) {
    throw new Error("DEPLOYER_PRIVATE_KEY not set");
  }
  return key as `0x${string}`;
}

export async function poolCreate(opts: {
  name: string;
  threshold: number;
  members: string;
}): Promise<void> {
  console.log(`Creating pool "${opts.name}" with threshold ${opts.threshold}`);
  console.log(`Members: ${opts.members}`);
  console.log("(Deploy script not yet implemented — use deploy:erc8183 and deploy:safe)");
}

export async function poolJoin(opts: {
  pool: `0x${string}`;
  voucher: `0x${string}`;
}): Promise<void> {
  const config = getPoolConfig(opts.pool);
  const pool = new MutualAidPool(config, getDeployerKey());
  pool.vouchForMember(opts.voucher, opts.voucher);
  console.log(`Voucher ${opts.voucher} recorded for pool ${opts.pool}`);
}

export async function poolStatus(opts: { pool: `0x${string}` }): Promise<void> {
  const config = getPoolConfig(opts.pool);
  const publicClient = createPublicClient({
    chain: CHAIN,
    transport: http(RPC_URL),
  });

  console.log(`Pool Safe: ${opts.pool}`);
  console.log(`Chain: ${CHAIN.name} (${CHAIN_ID})`);

  try {
    const pool = new MutualAidPool(config, getDeployerKey());
    const balance = await pool.getPoolBalance();
    console.log(`Balance: ${balance} USDC (raw)`);
  } catch {
    console.log("Balance: (could not read)");
  }

  const code = await publicClient.getBytecode({ address: opts.pool });
  console.log(`Safe deployed: ${code && code !== "0x" ? "yes" : "no"}`);

  const erc8183 = config.agenticCommerceAddress;
  if (erc8183 && erc8183 !== "0x0000000000000000000000000000000000000000") {
    const ercCode = await publicClient.getBytecode({ address: erc8183 });
    console.log(`ERC-8183 deployed: ${ercCode && ercCode !== "0x" ? "yes" : "no"}`);
  }
}

export async function poolSync(opts: { pool: `0x${string}` }): Promise<void> {
  const config = getPoolConfig(opts.pool);
  const pool = new MutualAidPool(config, getDeployerKey());
  console.log("Syncing all member streams...");
  await pool.syncAllMemberStreams();
  const members = pool.getMembers();
  console.log(`Synced ${members.length} members`);
  for (const m of members) {
    console.log(`  ${m.address}: active=${m.streamActive}, updated=${new Date(m.lastStreamUpdateAt).toISOString()}`);
  }
}

export async function poolStreamOpen(opts: {
  pool: `0x${string}`;
  flowRate: number;
}): Promise<void> {
  const config = getPoolConfig(opts.pool);
  const privateKey = getDeployerKey();
  const { openContributionStream } = await import("../../core/streaming.js");

  console.log(`Opening stream to ${opts.pool} at $${opts.flowRate}/month`);
  try {
    const txHash = await openContributionStream({
      rpcUrl: RPC_URL,
      privateKey,
      superTokenAddress: USDCX_ADDRESS,
      recipientAddress: opts.pool,
      flowRatePerMonth: opts.flowRate,
    }, CHAIN);
    console.log(`Stream opened: ${txHash}`);
  } catch (error) {
    console.error(`Failed to open stream: ${error}`);
  }
}

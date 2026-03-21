import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CHAIN, CHAIN_ID, RPC_URL, USDC_ADDRESS, SUPERFLUID_HOST, USDCX_ADDRESS } from "../../core/config";
import { ERC8004_IDENTITY_REGISTRY } from "../../core/erc8004";
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
    superfluidHost: SUPERFLUID_HOST ?? undefined,
    superTokenAddress: USDCX_ADDRESS ?? undefined,
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
  ensName?: string;
}): Promise<void> {
  const privateKey = getDeployerKey();
  const account = privateKeyToAccount(privateKey);

  console.log(`Creating pool "${opts.name}" with threshold ${opts.threshold}`);
  console.log(`Members: ${opts.members}`);
  if (opts.ensName) {
    console.log(`ENS name: ${opts.ensName}.pool.eth`);
  }
  console.log(`Chain: ${CHAIN.name} (${CHAIN.id})`);

  const SafeSDK = (await import("@safe-global/protocol-kit")).default;
  const memberAddresses = opts.members.split(",").map((m) => m.trim()).filter(Boolean);

  const safeSdk = await SafeSDK.init({
    provider: RPC_URL,
    signer: privateKey,
    predictedSafe: {
      safeAccountConfig: {
        owners: [account.address, ...memberAddresses],
        threshold: opts.threshold,
      },
      safeDeploymentConfig: { saltNonce: String(Date.now()) },
    },
  });

  const safeAddress = (await safeSdk.getAddress()) as `0x${string}`;
  console.log(`\nPool Safe deployed at: ${safeAddress}`);
  console.log(`(Counterfactual — first transaction will deploy it)`);

  if (ERC8004_IDENTITY_REGISTRY.length > 1) {
    try {
      const { registerERC8004Agent } = await import("../../core/erc8004.js");
      const seed = `pool-${opts.name}-${Date.now()}`;
      await registerERC8004Agent(seed, privateKey, ERC8004_IDENTITY_REGISTRY);
      console.log(`Pool registered on ERC-8004`);
    } catch (err) {
      console.log(`ERC-8004 registration skipped: ${err}`);
    }
  }

  const fs = await import("fs");
  const path = await import("path");
  const envPath = path.join(process.cwd(), ".env");
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";

  const poolLine = `POOL_SAFE_ADDRESS=${safeAddress}`;
  const poolRegex = /^POOL_SAFE_ADDRESS=.*$/m;
  if (poolRegex.test(envContent)) {
    envContent = envContent.replace(poolRegex, poolLine);
  } else {
    envContent += `\n${poolLine}`;
  }
  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log(`\nUpdated .env with POOL_SAFE_ADDRESS=${safeAddress}`);

  if (opts.ensName) {
    console.log(`\nENS name "${opts.ensName}.pool.eth" — agent should register via SKILL.md after deployment.`);
  }

  console.log(`\nNext: Add AGENTIC_COMMERCE_ADDRESS to .env, then use:`);
  console.log(`  npx tsx src/cli/index.ts pool status --pool ${safeAddress}`);
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

export async function poolStatus(opts: { pool: `0x${string}`; ensName?: string }): Promise<void> {
  const config = getPoolConfig(opts.pool);
  const publicClient = createPublicClient({
    chain: CHAIN,
    transport: http(RPC_URL),
  });

  if (opts.ensName) {
    try {
      const { resolveEnsName } = await import("../../core/ens.js");
      const resolved = await resolveEnsName(opts.ensName);
      if (resolved) {
        console.log(`ENS ${opts.ensName} resolves to ${resolved}`);
      } else {
        console.log(`ENS ${opts.ensName} not yet registered`);
      }
    } catch {
      console.log(`ENS resolution failed for ${opts.ensName}`);
    }
  }

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
  if (!SUPERFLUID_HOST || !USDCX_ADDRESS) {
    console.error("Superfluid not supported on this chain");
    return;
  }
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

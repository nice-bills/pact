import { CHAIN_ID, RPC_URL, USDC_ADDRESS } from "../core/config.js";
import { MutualAidPool } from "../core/pool.js";
import type { PoolConfig } from "../core/types.js";

const DEMO_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
if (!DEMO_PRIVATE_KEY) {
  console.error("Set DEPLOYER_PRIVATE_KEY in .env");
  process.exit(1);
}

const DEPLOYED_CONTRACTS = {
  "base-sepolia": {
    erc8183: "0x76Dd9C55D9a2e4B36219b4cC749deEF8324333e6",
    safe: process.env.POOL_SAFE_ADDRESS ?? "0xc6c0D80d00d3aCA069386245F4b3Ff1f3c1E9b4F",
    explorer: "https://sepolia.basescan.org",
  },
  "avalanche-fuji": {
    erc8183: "0x77107B62a9149F0073F40846af477fa6f9E3543A",
    safe: process.env.POOL_SAFE_ADDRESS ?? "0xc6c0D80d00d3aCA069386245F4b3Ff1f3c1E9b4F",
    explorer: "https://testnet.snowtrace.io",
  },
};

const chainKey = CHAIN_ID === 84532 ? "base-sepolia" : "avalanche-fuji";
const contracts = DEPLOYED_CONTRACTS[chainKey as keyof typeof DEPLOYED_CONTRACTS] ?? DEPLOYED_CONTRACTS["base-sepolia"];

const poolConfig: PoolConfig = {
  safeAddress: contracts.safe as `0x${string}`,
  agenticCommerceAddress: contracts.erc8183 as `0x${string}`,
  paymentTokenAddress: USDC_ADDRESS,
  chainId: CHAIN_ID,
  rpcUrl: RPC_URL,
  threshold: 2,
  monthlyContributionUsd: 5,
};

async function main() {
  console.log("=== Mutual Aid Pool — Live Demo ===\n");
  console.log(`Chain: ${CHAIN_ID} (${chainKey})`);
  console.log(`Explorer: ${contracts.explorer}`);

  const pool = new MutualAidPool(poolConfig, DEMO_PRIVATE_KEY);

  console.log(`\n1. Pool initialized`);
  console.log(`   Safe:      ${contracts.safe}`);
  console.log(`   ERC-8183:  ${contracts.erc8183}`);

  // Check pool balance
  let poolBalance = 0n;
  try {
    poolBalance = await pool.getPoolBalance();
    console.log(`\n2. Pool balance: ${Number(poolBalance) / 1e6} USDC`);
  } catch (e) {
    console.log(`\n2. Pool balance: (could not read — check RPC)`);
  }

  // Show verified on-chain transactions
  console.log(`\n3. Verified on-chain transactions:`);
  if (chainKey === "base-sepolia") {
    console.log(`   Uniswap swap: ${contracts.explorer}/tx/0x6bcc8a14256a60be604950a9a68fe4aea73199a30c386ef3b38cae6ea1d6e430`);
    console.log(`   (1 USDC → WETH)`);
    console.log(`   Claim created: ${contracts.explorer}/tx/0xfc7d29925b4242d9d787ca6dd2e7d82dc28aaa27464ade8d3b3f702547d7e1ad`);
    console.log(`   (Job #1 created on ERC-8183)`);
  }

  // Read existing job #1
  console.log(`\n4. Reading existing claim from chain...`);
  try {
    const job = await pool.getJob(1n);
    console.log(`   Job #1:`);
    console.log(`     Status: ${job.status}`);
    console.log(`     Claimant: ${job.claimantAddress}`);
    const desc = Buffer.from(job.description.slice(2), "hex").toString("utf8");
    console.log(`     Description: ${desc}`);
  } catch (e) {
    console.log(`   Could not read job: ${e}`);
  }

  // Show all deployed contracts
  console.log(`\n=== All Deployed Contracts ===`);
  console.log(`Avalanche Fuji:  0x77107B62a9149F0073F40846af477fa6f9E3543A`);
  console.log(`Celo Sepolia:    0x77107B62a9149F0073F40846af477fa6f9E3543A`);
  console.log(`Base Sepolia:    ${contracts.erc8183}`);
  console.log(`Status Sepolia:  0x3f4D1B21251409075a0FB8E1b0C0A30B23f05653`);

  console.log(`\n=== Run the full CLI demo ===`);
  console.log(`npm run cli:pool -- status --pool ${contracts.safe}`);
  console.log(`npm run cli:claim -- submit --pool ${contracts.safe} --amount 10 --evidence QmXyz... --description "Emergency"`);
}

main().catch(console.error);

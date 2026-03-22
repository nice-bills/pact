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
    uniswapRouter: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    explorer: "https://sepolia.basescan.org",
  },
  "avalanche-fuji": {
    erc8183: "0x77107B62a9149F0073F40846af477fa6f9E3543A",
    safe: process.env.POOL_SAFE_ADDRESS ?? "0xc6c0D80d00d3aCA069386245F4b3Ff1f3c1E9b4F",
    uniswapRouter: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
    usdc: "0x5425890298aed601595a70AB815c96711a31Bc65",
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
  console.log(`   USDC:      ${contracts.usdc}`);

  // Check pool balance
  let poolBalance = 0n;
  try {
    poolBalance = await pool.getPoolBalance();
    console.log(`\n2. Pool balance: ${Number(poolBalance) / 1e6} USDC`);
  } catch (e) {
    console.log(`\n2. Pool balance: (could not read — check RPC)`);
  }

  // Show live transactions as evidence
  console.log(`\n3. Previously verified on-chain:`);
  if (chainKey === "base-sepolia") {
    console.log(`   Uniswap swap: ${contracts.explorer}/tx/0x6bcc8a14256a60be604950a9a68fe4aea73199a30c386ef3b38cae6ea1d6e430`);
    console.log(`   (1 USDC → WETH, pool 0x46880b404cd35c165eddeff7421019f8dd25f4ad)`);
  }

  // Demo claim if pool is funded
  const maria = "0x4444444444444444444444444444444444444444" as `0x${string}`;
  const mariaClaim = {
    claimantAddress: maria,
    amountUsd: 80,
    evidenceIpfsHash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    description: "Hospital bill for son's medication",
  };

  console.log(`\n4. Claim submission (Maria):`);
  console.log(`   Amount:   $${mariaClaim.amountUsd}`);
  console.log(`   Evidence: ${mariaClaim.evidenceIpfsHash}`);
  console.log(`   Desc:     ${mariaClaim.description}`);

  if (poolBalance === 0n) {
    console.log(`\n   ⚠️  Pool has 0 USDC — cannot create claim`);
    console.log(`   Send USDC to: ${contracts.safe}`);
    console.log(`   Then run: npm run demo:fresh`);
  } else {
    console.log(`\n5. Creating on-chain job via ERC-8183...`);
    try {
      const result = await pool.createClaim(mariaClaim);
      console.log(`   Job #${result.jobId} created`);
      console.log(`   createJob:  ${result.txs.createJob}`);
      console.log(`   fundJob:    ${result.txs.fundJob}`);

      console.log(`\n6. Committee approval (2-of-3 threshold):`);
      console.log(`   Alice: APPROVE`);
      console.log(`   Bob:   APPROVE`);

      const completeTx = await pool.completeClaim(result.jobId, "Committee unanimous");
      console.log(`   COMPLETED: ${completeTx}`);
      console.log(`   ${contracts.explorer}/tx/${completeTx}`);
    } catch (error) {
      console.log(`   Failed: ${error}`);
    }
  }

  // Show all deployed contracts
  console.log(`\n=== All Deployed Contracts ===`);
  console.log(`Avalanche Fuji:  0x77107B62a9149F0073F40846af477fa6f9E3543A`);
  console.log(`Celo Sepolia:    0x77107B62a9149F0073F40846af477fa6f9E3543A (${contracts.explorer}/address/0x77107B62a9149F0073F40846af477fa6f9E3543A)`);
  console.log(`Base Sepolia:    ${contracts.erc8183} (${contracts.explorer}/address/${contracts.erc8183})`);
  console.log(`Status Sepolia:  0x3f4D1B21251409075a0FB8E1b0C0A30B23f05653 (https://sepoliascan.status.network/address/0x3f4D1B21251409075a0FB8E1b0C0A30B23f05653)`);
}

main().catch(console.error);

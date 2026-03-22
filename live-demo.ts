import "dotenv/config";
import { createPublicClient, createWalletClient, http, parseUnits, padHex, stringToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { AGENTIC_COMMERCE_ABI } from "./src/core/abi.js";
import * as fs from "fs";
import * as path from "path";

const PRIVATE_KEY = (process.env.DEPOLYER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY || "") as `0x${string}`;
const ERC8183 = "0x76Dd9C55D9a2e4B36219b4cC749deEF8324333e6";
const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const RPC = "https://base-sepolia-rpc.publicnode.com";
const EXPLORER = "https://sepolia.basescan.org";

const ERC20_ABI = [
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "value", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
] as const;

const publicClient = createPublicClient({ chain: baseSepolia, transport: http(RPC) });
const wallet = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({ account: wallet, chain: baseSepolia, transport: http(RPC) });

async function waitForTx(hash: `0x${string}`) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`Tx failed: ${hash}`);
  return receipt;
}

function toBytes32(value: string): `0x${string}` {
  const truncated = value.length > 31 ? value.slice(0, 31) : value;
  return padHex(stringToHex(truncated), { size: 32 });
}

async function main() {
  console.log("=== Mutual Aid Pool — Live Demo ===\n");
  console.log(`Deployer: ${wallet.address}`);
  console.log(`ERC-8183: ${ERC8183}`);
  console.log(`USDC: ${USDC}`);
  console.log(`Chain: Base Sepolia (84532)\n`);

  // Check balances
  const ethBal = await publicClient.getBalance({ address: wallet.address });
  const usdcBal = await publicClient.readContract({ address: USDC, abi: ERC20_ABI, functionName: "balanceOf", args: [wallet.address] });
  console.log(`Deployer ETH: ${Number(ethBal) / 1e18}`);
  console.log(`Deployer USDC: ${Number(usdcBal) / 1e6}\n`);

  if (Number(usdcBal) < 5) {
    console.error(`ERROR: Need at least 5 USDC, have ${Number(usdcBal) / 1e6}`);
    process.exit(1);
  }

  const CLAIM_AMOUNT = 5;
  const amountWei = parseUnits(CLAIM_AMOUNT.toFixed(6), 6);
  const claimant = wallet.address;
  const evaluator = wallet.address;
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60);
  const description = "Emergency food and supplies | Claimant:OUTSIDER | Class:outsider | AmountUsd:5 | Evidence:QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";

  // Step 1: Create Job
  console.log("--- Step 1: createJob ---");
  const createJobTx = await walletClient.writeContract({
    address: ERC8183,
    abi: AGENTIC_COMMERCE_ABI,
    functionName: "createJob",
    args: [claimant, evaluator, expiry, description],
  }) as `0x${string}`;
  const createReceipt = await waitForTx(createJobTx);
  const jobId = createReceipt.logs[0]?.topics[1] ? BigInt(createReceipt.logs[0].topics[1]) : 2n;
  console.log(`  Job #${jobId} created`);
  console.log(`  Tx: ${EXPLORER}/tx/${createJobTx}`);

  // Step 2: Set Budget
  console.log("\n--- Step 2: setBudget ---");
  const setBudgetTx = await walletClient.writeContract({
    address: ERC8183,
    abi: AGENTIC_COMMERCE_ABI,
    functionName: "setBudget",
    args: [jobId, amountWei],
  }) as `0x${string}`;
  await waitForTx(setBudgetTx);
  console.log(`  Budget set: ${CLAIM_AMOUNT} USDC`);
  console.log(`  Tx: ${EXPLORER}/tx/${setBudgetTx}`);

  // Step 3: Approve USDC
  console.log("\n--- Step 3: approve USDC ---");
  const approveTx = await walletClient.writeContract({
    address: USDC,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [ERC8183, amountWei],
  }) as `0x${string}`;
  await waitForTx(approveTx);
  console.log(`  Approved ${CLAIM_AMOUNT} USDC for ERC-8183`);
  console.log(`  Tx: ${EXPLORER}/tx/${approveTx}`);

  // Step 4: Fund Job
  console.log("\n--- Step 4: fund ---");
  const fundTx = await walletClient.writeContract({
    address: ERC8183,
    abi: AGENTIC_COMMERCE_ABI,
    functionName: "fund",
    args: [jobId],
  }) as `0x${string}`;
  await waitForTx(fundTx);
  console.log(`  Job #${jobId} funded: ${CLAIM_AMOUNT} USDC transferred from deployer to ERC-8183`);
  console.log(`  Tx: ${EXPLORER}/tx/${fundTx}`);

  // Step 5: Submit Deliverable (provider calls submit)
  console.log("\n--- Step 5: submit (provider delivers) ---");
  const deliverable = toBytes32("Medical receipt verified, community impact positive");
  const submitTx = await walletClient.writeContract({
    address: ERC8183,
    abi: AGENTIC_COMMERCE_ABI,
    functionName: "submit",
    args: [jobId, deliverable],
  }) as `0x${string}`;
  await waitForTx(submitTx);
  console.log(`  Job #${jobId} submitted by provider`);
  console.log(`  Tx: ${EXPLORER}/tx/${submitTx}`);

  // Step 6: Complete (evaluator approves)
  console.log("\n--- Step 6: complete (evaluator approves) ---");
  const completeReason = toBytes32("Claim verified, amount reasonable for emergency need");
  const completeTx = await walletClient.writeContract({
    address: ERC8183,
    abi: AGENTIC_COMMERCE_ABI,
    functionName: "complete",
    args: [jobId, completeReason],
  }) as `0x${string}`;
  await waitForTx(completeTx);
  console.log(`  Job #${jobId} completed: ${CLAIM_AMOUNT} USDC released to provider`);
  console.log(`  Tx: ${EXPLORER}/tx/${completeTx}`);

  // Final balances
  const finalUsdcBal = await publicClient.readContract({ address: USDC, abi: ERC20_ABI, functionName: "balanceOf", args: [wallet.address] });
  console.log(`\n--- Final State ---`);
  console.log(`Deployer USDC balance: ${Number(finalUsdcBal) / 1e6}`);
  console.log(`(Started with ${Number(usdcBal) / 1e6}, spent ~${CLAIM_AMOUNT} on claim)\n`);

  // Save job ID for reference
  const deploymentsPath = path.join(process.cwd(), "config", "deployments.json");
  if (fs.existsSync(deploymentsPath)) {
    const deps = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
    deps["base-sepolia"].lastDemoJob = { jobId: jobId.toString(), amount: CLAIM_AMOUNT, txs: { createJob: createJobTx, setBudget: setBudgetTx, approve: approveTx, fund: fundTx, submit: submitTx, complete: completeTx } };
    fs.writeFileSync(deploymentsPath, JSON.stringify(deps, null, 2));
    console.log(`Updated config/deployments.json with demo txs`);
  }

  console.log("=== FULL CLAIM LIFECYCLE COMPLETE ===");
  console.log("All 6 transactions verified on Base Sepolia:");
  console.log(`  ${EXPLORER}/tx/${completeTx}`);
}

main().catch((err) => {
  console.error("\nDemo failed:", err.message);
  process.exit(1);
});

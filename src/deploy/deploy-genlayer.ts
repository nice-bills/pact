import { execSync } from "child_process";
import { writeFileSync, readFileSync } from "fs";

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const NETWORK = process.env.GENLAYER_NETWORK ?? "testnet-bradbury";

if (!PRIVATE_KEY) {
  console.error("DEPLOYER_PRIVATE_KEY not set");
  process.exit(1);
}

const contractPath = "contracts/genlayer/claim_evaluator.py";
const outputPath = "config/deployments.json";

console.log("=== Deploying ClaimEvaluator to GenLayer ===\n");
console.log(`Network: ${NETWORK}`);
console.log(`Contract: ${contractPath}`);

// Import private key
execSync(
  `npx genlayer account import --name deployer --private-key ${PRIVATE_KEY} --password deploy123 --overwrite`,
  { stdio: "inherit" }
);

// Deploy
console.log("\nDeploying...");
let deployedAddress: string;
try {
  const output = execSync(
    `npx genlayer deploy --contract ${contractPath} --network ${NETWORK}`,
    { encoding: "utf-8" }
  );
  console.log(output);

  // Parse address from output
  const match = output.match(/Contract Address:\s+(0x[a-fA-F0-9]+)/);
  if (match) {
    deployedAddress = match[1];
  } else {
    console.error("Could not parse deployed address from output");
    process.exit(1);
  }
} catch (e: any) {
  console.error("Deploy failed:", e.message);
  process.exit(1);
}

console.log(`\n✅ ClaimEvaluator deployed at: ${deployedAddress}`);

// Update deployments.json
try {
  const deployments = JSON.parse(readFileSync(outputPath, "utf-8"));
  deployments["genlayer"] = {
    chainId: 61999,
    network: NETWORK,
    claimEvaluator: deployedAddress,
    contract: contractPath,
    rpc: "https://studio.genlayer.com/api",
  };
  writeFileSync(outputPath, JSON.stringify(deployments, null, 2));
  console.log(`Updated ${outputPath}`);
} catch {
  console.log(`Manual: add to ${outputPath}: genlayer.claimEvaluator = ${deployedAddress}`);
}

// Verify deployment
console.log("\nVerifying...");
const schema = execSync(
  `npx genlayer schema ${deployedAddress} --network ${NETWORK}`,
  { encoding: "utf-8" }
);
console.log("Schema:", schema.slice(0, 500));

console.log("\n=== Next Steps ===");
console.log(`1. Add GENLAYER_CLAIM_EVALUATOR=${deployedAddress} to .env`);
console.log(`2. Call evaluate_claim via: npx genlayer call ${deployedAddress} evaluate_claim`);

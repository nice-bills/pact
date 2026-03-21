import { privateKeyToAccount } from "viem/accounts";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const RPC = process.env.STATUS_L2_RPC ?? "https://public.sepolia.rpc.status.network";

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("DEPLOYER_PRIVATE_KEY not set");
    process.exit(1);
  }

  const deployer = privateKeyToAccount(privateKey as `0x${string}`);
  console.log(`Deploying to Status Network Sepolia (Chain ID: 1660990954)`);
  console.log(`RPC: ${RPC}`);
  console.log(`Deployer: ${deployer.address}`);

  try {
    console.log("\n1. Building StatusAgent with solc 0.8.19 (no PUSH0)...");
    execSync(
      "forge build --contracts contracts/status/ --use solc:0.8.19",
      { encoding: "utf-8", stdio: "inherit" }
    );

    console.log("\n2. Deploying StatusAgent...");
    const output = execSync(
      `forge create --rpc-url "${RPC}" --private-key ${privateKey} --contracts contracts/status/ --use solc:0.8.19 contracts/status/StatusAgent.sol:StatusAgent --json`,
      { encoding: "utf-8" }
    );
    const result = JSON.parse(output);

    if (result.error) {
      console.error(`Deploy failed: ${result.error.message}`);
      process.exit(1);
    }

    const deployedAddress = result.deployedTo;
    const txHash = result.transactionHash;

    if (!deployedAddress) {
      console.error("Deploy failed: no address in result");
      process.exit(1);
    }

    console.log(`\nStatusAgent deployed at: ${deployedAddress}`);
    console.log(`Deploy tx: ${txHash}`);
    console.log(`Explorer: https://sepoliascan.status.network/tx/${txHash}`);

    const envPath = path.join(process.cwd(), ".env");
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
    const lines = [
      `STATUS_AGENT_ADDRESS=${deployedAddress}`,
      `STATUS_L2_RPC=${RPC}`,
    ];
    for (const line of lines) {
      const key = line.split("=")[0];
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, line);
      } else {
        envContent += `\n${line}`;
      }
    }
    fs.writeFileSync(envPath, envContent.trim() + "\n");
    console.log("\nUpdated .env with STATUS_AGENT_ADDRESS");
    console.log("\n3. Executing gasless registration transaction...");
    console.log(`   Run: npm run deploy:gasless`);
  } catch (err) {
    console.error(`Deploy error: ${err}`);
    process.exit(1);
  }
}

main();

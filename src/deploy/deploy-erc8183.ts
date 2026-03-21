import { CHAIN } from "../core/config.js";
import { privateKeyToAccount } from "viem/accounts";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("DEPLOYER_PRIVATE_KEY not set");
    process.exit(1);
  }

  const usdcAddress = process.env.USDC_ADDRESS;
  const treasury = process.env.TREASURY_ADDRESS ?? privateKeyToAccount(privateKey as `0x${string}`).address;

  if (!usdcAddress) {
    console.error("USDC_ADDRESS not set in .env");
    process.exit(1);
  }

  const rpcUrl = process.env[`${CHAIN.name.toUpperCase().replace(/-/g, "_")}_RPC`] ?? CHAIN.rpcUrls.default.http[0];
  const chainId = CHAIN.id;

  console.log("Deploying AgenticCommerce (ERC-8183)...");
  console.log(`Chain: ${CHAIN.name} (${chainId})`);
  console.log(`RPC: ${rpcUrl}`);
  console.log(`USDC: ${usdcAddress}`);
  console.log(`Treasury: ${treasury}`);

  try {
    const args = [
      "create", "--rpc-url", rpcUrl,
      "--private-key", privateKey,
      "--constructor-args-path", "/tmp/erc8183_args.json",
      "contracts/AgenticCommerce.sol:AgenticCommerce",
    ];

    const argsContent = JSON.stringify([usdcAddress, treasury, "0"]);
    fs.writeFileSync("/tmp/erc8183_args.json", argsContent);

    const output = execSync(`forge ${args.join(" ")} --broadcast --json`, { encoding: "utf-8" });
    const result = JSON.parse(output);

    if (result.error) {
      console.error(`Deployment failed: ${result.error}`);
      process.exit(1);
    }

    const deployedAddress = result.deployedTo;
    const txHash = result.transactionHash;

    if (!deployedAddress) {
      console.error("Deployment failed: no contract address in result");
      console.error(output);
      process.exit(1);
    }

    console.log(`\nAgenticCommerce deployed at: ${deployedAddress}`);
    console.log(`Transaction: ${txHash}`);

    const envPath = path.join(process.cwd(), ".env");
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
    const line = `AGENTIC_COMMERCE_ADDRESS=${deployedAddress}`;
    const regex = /^AGENTIC_COMMERCE_ADDRESS=.*$/m;
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, line);
    } else {
      envContent += `\n${line}`;
    }
    fs.writeFileSync(envPath, envContent.trim() + "\n");
    console.log(`Updated .env with AGENTIC_COMMERCE_ADDRESS=${deployedAddress}`);
  } catch (err) {
    console.error(`Deployment error: ${err}`);
    process.exit(1);
  }
}

main();

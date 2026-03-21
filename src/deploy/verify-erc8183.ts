import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

const RPC_URL = process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";

async function main() {
  const address = process.env.AGENTIC_COMMERCE_ADDRESS;
  if (!address) {
    console.error("AGENTIC_COMMERCE_ADDRESS not set in .env");
    process.exit(1);
  }

  console.log("Verifying AgenticCommerce at:", address);

  const publicClient = createPublicClient({ chain: baseSepolia, transport: http(RPC_URL) });
  const code = await publicClient.getBytecode({ address: address as `0x${string}` });
  console.log("Contract deployed:", code && code !== "0x" ? "YES" : "NO");

  if (!code || code === "0x") {
    console.error("Contract not found at this address");
    process.exit(1);
  }

  console.log("Contract verified successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

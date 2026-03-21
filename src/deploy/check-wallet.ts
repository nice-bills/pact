import { createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import * as fs from "fs";

const RPC_URL = process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("DEPLOYER_PRIVATE_KEY not set");
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL),
  });
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(RPC_URL),
  });

  console.log("Wallet address:", account.address);

  const usdcBalance = await publicClient.readContract({
    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    abi: [
      {
        name: "balanceOf",
        type: "function",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
      },
    ],
    functionName: "balanceOf",
    args: [account.address],
  });

  console.log("USDC balance:", usdcBalance.toString(), "(raw)");
  console.log("USDC balance:", Number(usdcBalance) / 1e6, "USDC");

  const ethBalance = await publicClient.getBalance({ address: account.address });
  console.log("ETH balance:", ethBalance.toString(), "(wei)");
  console.log("ETH balance:", Number(ethBalance) / 1e18, "ETH");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

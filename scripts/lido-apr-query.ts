import "dotenv/config";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const LIDO_STETH = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const RPC = process.env.ETH_MAINNET_RPC ?? "https://eth.llamarpc.com";

const publicClient = createPublicClient({ chain: mainnet, transport: http(RPC) });

async function main() {
  console.log("=== Lido stETH Oracle Query ===\n");
  console.log(`RPC: ${RPC}`);
  console.log(`stETH: ${LIDO_STETH}\n`);

  const stETHAbi = [
    { name: "getPooledEthByShares", type: "function", stateMutability: "view", inputs: [{ name: "shares", type: "uint256" }], outputs: [{ name: "ethAmount", type: "uint256" }] },
    { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  ] as const;

  try {
    const [rate, totalSupply] = await Promise.all([
      publicClient.readContract({ address: LIDO_STETH as `0x${string}`, abi: stETHAbi, functionName: "getPooledEthByShares", args: [10n ** 18n] }),
      publicClient.readContract({ address: LIDO_STETH as `0x${string}`, abi: stETHAbi, functionName: "totalSupply" }),
    ]);
    const rateEth = Number(rate as bigint) / 1e18;
    const totalStEth = Number(totalSupply as bigint) / 1e18;
    const totalEth = rateEth * totalStEth;
    const premium = (rateEth - 1) * 100;
    console.log(`stETH/ETH exchange rate: ${rateEth.toFixed(6)} ETH per stETH`);
    console.log(`stETH total supply: ${totalStEth.toLocaleString()} stETH`);
    console.log(`Total ETH backed: ${totalEth.toLocaleString()} ETH`);
    console.log(`Premium over 1.0: +${premium.toFixed(4)}%`);
    console.log(`\nThis rate is used by StETHTreasury.getCurrentAPR() to compute real yield accrual.`);
    console.log(`The StETHTreasury._accrue() uses this APR from Lido's on-chain oracle.`);
  } catch (e) {
    console.error(`Query failed: ${e}`);
  }
}

main().catch(console.error);

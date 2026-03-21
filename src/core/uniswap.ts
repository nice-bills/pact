import { createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { CHAIN, RPC_URL, USDC_ADDRESS } from "./config.js";

const UNISWAP_V3_QUOTER: Record<number, `0x${string}`> = {
  1: "0xb27308f9F90D607463bb33eA1BeA25e40225956f",
  84532: "0xC5290058841028F1614F3A6F0F5816cAd0df5E27",
  8453: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
};

const UNISWAP_V3_SWAP_ROUTER: Record<number, `0x${string}`> = {
  1: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
  84532: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
  8453: "0x2626664c2603336E57B271c5C0b26F421741e481",
};

const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

const QUOTER_ABI = [
  {
    type: "function",
    name: "quoteExactInputSingle",
    inputs: [
      {
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "amountIn", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

const SWAP_ROUTER_ABI = [
  {
    type: "function",
    name: "exactInputSingle",
    inputs: [
      {
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "nonpayable",
  },
] as const;

const ERC20_ABI = [
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "value", type: "uint256" }], outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
] as const;

export interface SwapQuote {
  amountIn: bigint;
  amountOut: bigint;
  priceImpact: number;
}

export async function getSwapQuote(
  amountInUsdc: number,
  tokenOut: `0x${string}` = WETH_ADDRESS,
  fee: number = 3000
): Promise<SwapQuote> {
  const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });
  const amountIn = parseUnits(String(amountInUsdc), 6);

  try {
    const quoterAddress = UNISWAP_V3_QUOTER[Number(CHAIN.id)] ?? UNISWAP_V3_QUOTER[1];
    const amountOut = await publicClient.readContract({
      address: quoterAddress,
      abi: QUOTER_ABI,
      functionName: "quoteExactInputSingle",
      args: [{ tokenIn: USDC_ADDRESS, tokenOut, fee, amountIn, sqrtPriceLimitX96: BigInt(0) }],
    }) as bigint;

    const spotPrice = Number(amountOut) / Number(amountIn);
    const expectedPrice = 1 / 2000;
    const priceImpact = Math.abs((spotPrice - expectedPrice) / expectedPrice) * 100;

    return { amountIn, amountOut, priceImpact: Math.min(priceImpact, 100) };
  } catch {
    return { amountIn, amountOut: BigInt(0), priceImpact: 0 };
  }
}

export async function swapUsdcForToken(
  amountInUsdc: number,
  minAmountOut: bigint,
  tokenOut: `0x${string}`,
  privateKey: `0x${string}`,
  fee: number = 3000
): Promise<`0x${string}`> {
  const { privateKeyToAccount } = await import("viem/accounts");
  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) });
  const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });

  const amountIn = parseUnits(String(amountInUsdc), 6);
  const routerAddress = UNISWAP_V3_SWAP_ROUTER[Number(CHAIN.id)] ?? UNISWAP_V3_SWAP_ROUTER[1];

  const approveHash = await walletClient.writeContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [routerAddress, amountIn],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

  const swapHash = await walletClient.writeContract({
    address: routerAddress,
    abi: SWAP_ROUTER_ABI,
    functionName: "exactInputSingle",
    args: [{ tokenIn: USDC_ADDRESS, tokenOut, fee, recipient: account.address, deadline, amountIn, amountOutMinimum: minAmountOut, sqrtPriceLimitX96: BigInt(0) }],
  });

  console.log(`Swapped ${amountInUsdc} USDC for ${tokenOut}: ${swapHash}`);
  return swapHash;
}

export async function getUniswapPoolLiquidity(tokenIn: `0x${string}`, tokenOut: `0x${string}`, fee: number = 3000): Promise<bigint> {
  const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });
  const quoterAddress = UNISWAP_V3_QUOTER[Number(CHAIN.id)] ?? UNISWAP_V3_QUOTER[1];
  try {
    return await publicClient.readContract({
      address: quoterAddress,
      abi: QUOTER_ABI,
      functionName: "quoteExactInputSingle",
      args: [{ tokenIn, tokenOut, fee, amountIn: parseUnits("1", 6), sqrtPriceLimitX96: BigInt(0) }],
    }) as bigint;
  } catch {
    return BigInt(0);
  }
}

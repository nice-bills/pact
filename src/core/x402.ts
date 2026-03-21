import { CHAIN_NAME, CHAIN_ID, RPC_URL, USDC_ADDRESS, CHAIN, X402_ENABLED } from "../core/config.js";
import { randomBytes } from "crypto";

export interface x402PaymentRequest {
  recipient: `0x${string}`;
  amount: bigint;
  scheme?: number;
  payload?: string;
}

export interface x402PaymentHeader {
  version: number;
  scheme: number;
  recipient: `0x${string}`;
  maxAmount: bigint;
  nonce: bigint;
  payload?: string;
}

function buildX402Header(req: x402PaymentRequest, maxAmount: bigint): x402PaymentHeader {
  const nonceBytes = randomBytes(16);
  return {
    version: 1,
    scheme: req.scheme ?? 1,
    recipient: req.recipient,
    maxAmount,
    nonce: BigInt("0x" + nonceBytes.toString("hex")),
    payload: req.payload,
  };
}

function encodeX402Header(header: x402PaymentHeader): string {
  const encoded = [
    `x402-version: ${header.version}`,
    `x402-scheme: ${header.scheme}`,
    `x402-recipient: ${header.recipient}`,
    `x402-max-amount: ${header.maxAmount.toString()}`,
    `x402-nonce: ${header.nonce.toString()}`,
  ];
  if (header.payload) {
    encoded.push(`x402-payload: ${header.payload}`);
  }
  return encoded.join("\n");
}

export async function sendX402Payment(
  url: string,
  req: x402PaymentRequest,
  maxAmount: bigint,
  apiKey?: string
): Promise<Response> {
  const header = buildX402Header(req, maxAmount);
  const encodedHeader = encodeX402Header(header);
  const signature = "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x402-Signature": signature,
    "x402-Authorization": encodedHeader,
  };

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  return fetch(url, { method: "POST", headers, body: JSON.stringify(req) });
}

export function isX402Enabled(): boolean {
  return X402_ENABLED;
}

export function getX402Config() {
  if (!isX402Enabled()) {
    return null;
  }
  return {
    chainId: CHAIN_ID,
    chain: CHAIN,
    rpcUrl: RPC_URL,
    usdcAddress: USDC_ADDRESS,
    scheme: 1,
  };
}

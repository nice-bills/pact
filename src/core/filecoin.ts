import { createPublicClient, http } from "viem";
import { CHAIN, RPC_URL } from "./config.js";

export interface FilecoinStorageConfig {
  endpoint: string;
  apiKey?: string;
}

const FILECOIN_MAINNET = "https://api.filecoin.cloud";
const FILECOIN_TESTNET = "https://api.filecoin.cloud";

export const FILECOIN_STORAGE: FilecoinStorageConfig = {
  endpoint: process.env.FILECOIN_API_URL ?? FILECOIN_TESTNET,
  apiKey: process.env.FILECOIN_API_KEY,
};

export interface StoredEvidence {
  cid: string;
  size: number;
  uploadedAt: number;
  hash: `0x${string}`;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(FILECOIN_STORAGE.apiKey ? { Authorization: `Bearer ${FILECOIN_STORAGE.apiKey}` } : {}),
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Filecoin API error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function uploadEvidenceToFilecoin(
  evidenceData: string,
  filename: string
): Promise<StoredEvidence> {
  const payload = {
    data: evidenceData,
    filename,
    metadata: {
      chainId: Number(CHAIN.id),
      uploadedAt: new Date().toISOString(),
      source: "mutual-aid-pool",
    },
  };

  const result = await fetchJson<{ cid: string; size: number }>(
    `${FILECOIN_STORAGE.endpoint}/v0/storage/upload`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  const hash = await computeContentHash(evidenceData);

  return {
    cid: result.cid,
    size: result.size,
    uploadedAt: Date.now(),
    hash,
  };
}

export async function retrieveEvidenceFromFilecoin(cid: string): Promise<string | null> {
  try {
    const result = await fetchJson<{ data: string }>(
      `${FILECOIN_STORAGE.endpoint}/v0/storage/retrieve/${cid}`,
      { method: "GET" }
    );
    return result.data;
  } catch {
    return null;
  }
}

export async function verifyEvidenceOnFilecoin(cid: string, expectedHash: `0x${string}`): Promise<boolean> {
  try {
    const data = await retrieveEvidenceFromFilecoin(cid);
    if (!data) return false;
    const actualHash = await computeContentHash(data);
    return actualHash === expectedHash;
  } catch {
    return false;
  }
}

async function computeContentHash(data: string): Promise<`0x${string}`> {
  const { keccak256 } = await import("viem");
  const encoder = new TextEncoder();
  const hash = keccak256(encoder.encode(data));
  return hash as `0x${string}`;
}

export function ipfsToFilecoinCid(ipfsHash: string): string {
  return ipfsHash;
}

export function filecoinCidToIpfs(cid: string): string {
  return cid;
}

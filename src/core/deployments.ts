import fs from "node:fs";
import path from "node:path";

export interface DeploymentRecord {
  chainId: number;
  erc8183?: string;
  safe?: string | null;
  rpc?: string;
}

let cached: Record<string, DeploymentRecord> | null = null;

export function loadDeployments(cwd = process.cwd()): Record<string, DeploymentRecord> {
  if (cached) return cached;
  const filePath = path.join(cwd, "config", "deployments.json");
  if (!fs.existsSync(filePath)) {
    cached = {};
    return cached;
  }
  cached = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, DeploymentRecord>;
  return cached;
}

/** Clear deployment cache (for tests). */
export function resetDeploymentsCache(): void {
  cached = null;
}

export function resolveAgenticCommerceAddress(
  chainName: string,
  chainId: number,
  cwd = process.cwd()
): `0x${string}` | "" {
  const fromEnv = process.env.AGENTIC_COMMERCE_ADDRESS?.trim();
  if (fromEnv) return fromEnv as `0x${string}`;

  const deployments = loadDeployments(cwd);
  const byName = deployments[chainName];
  if (byName?.erc8183 && byName.chainId === chainId) {
    return byName.erc8183 as `0x${string}`;
  }

  for (const entry of Object.values(deployments)) {
    if (entry.chainId === chainId && entry.erc8183) {
      return entry.erc8183 as `0x${string}`;
    }
  }

  return "";
}

import fs from "node:fs";
import path from "node:path";

export interface PersistedMemberRecord {
  address: string;
  vouchedBy: string;
  joinedAt: number;
  chain: string;
}

export type MembersFile = Record<string, Record<string, PersistedMemberRecord>>;

export function membersFilePath(cwd = process.cwd()): string {
  return path.join(cwd, "config", "members.json");
}

export function readMembersFile(cwd = process.cwd()): MembersFile {
  const filePath = membersFilePath(cwd);
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as MembersFile;
}

export function poolMembersKey(poolAddress: `0x${string}`, chainId: number): string {
  return `${poolAddress.toLowerCase()}-${chainId}`;
}

export function loadMembersForPool(
  poolAddress: `0x${string}`,
  chainId: number,
  cwd = process.cwd()
): PersistedMemberRecord[] {
  const members = readMembersFile(cwd);
  const poolKey = poolMembersKey(poolAddress, chainId);
  const poolMembers = members[poolKey];
  if (!poolMembers) return [];
  return Object.values(poolMembers);
}

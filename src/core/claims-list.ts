import type { Claim, ClaimStatus } from "./types.js";

export const JOB_STATUS_BY_INDEX: readonly ClaimStatus[] = [
  "open",
  "funded",
  "submitted",
  "completed",
  "rejected",
  "expired",
] as const;

export function mapJobStatus(statusIndex: number): ClaimStatus {
  return JOB_STATUS_BY_INDEX[statusIndex] ?? "open";
}

export interface ParsedClaimDescription {
  claimant?: `0x${string}`;
  claimantClass?: "member" | "grace" | "outsider";
  amountUsd?: number;
  evidence?: string;
  reason?: string;
}

export function parseClaimDescription(description: string): ParsedClaimDescription {
  const parsed: ParsedClaimDescription = {};
  for (const segment of description.split(" | ")) {
    const colon = segment.indexOf(":");
    if (colon === -1) continue;
    const key = segment.slice(0, colon).trim();
    const value = segment.slice(colon + 1).trim();
    switch (key) {
      case "Claimant":
        parsed.claimant = value as `0x${string}`;
        break;
      case "Class":
        if (value === "member" || value === "grace" || value === "outsider") {
          parsed.claimantClass = value;
        }
        break;
      case "AmountUsd":
        parsed.amountUsd = Number(value);
        break;
      case "Evidence":
        parsed.evidence = value;
        break;
      case "Reason":
        parsed.reason = value;
        break;
      default:
        break;
    }
  }
  return parsed;
}

export interface OnChainJobRecord {
  id: bigint;
  client: `0x${string}`;
  provider: `0x${string}`;
  evaluator: `0x${string}`;
  description: string;
  budget: bigint;
  expiredAt: bigint;
  status: number;
}

export function jobRecordToClaim(job: OnChainJobRecord): Claim {
  const meta = parseClaimDescription(job.description);
  const claimant = meta.claimant ?? job.provider;
  return {
    id: job.id,
    claimant,
    amountRequested: job.budget,
    evidenceIpfsHash: meta.evidence ?? "",
    description: meta.reason ?? job.description,
    isMember: meta.claimantClass === "member",
    status: mapJobStatus(Number(job.status)),
    expiredAt: Number(job.expiredAt),
  };
}

export function formatClaimRow(claim: Claim): string {
  const amountUsd = Number(claim.amountRequested) / 1_000_000;
  const evidence = claim.evidenceIpfsHash ? claim.evidenceIpfsHash.slice(0, 12) : "—";
  const desc = claim.description.length > 40 ? `${claim.description.slice(0, 37)}...` : claim.description;
  return [
    String(claim.id).padStart(4),
    claim.status.padEnd(10),
    `$${amountUsd.toFixed(2)}`.padStart(8),
    claim.claimant.slice(0, 10) + "…",
    evidence.padEnd(14),
    desc,
  ].join("  ");
}

export const CLAIM_LIST_HEADER =
  "  ID  STATUS      AMOUNT    CLAIMANT      EVIDENCE        DESCRIPTION";

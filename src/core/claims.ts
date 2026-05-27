import { recoverMessageAddress } from "viem";
import type { ClaimSubmission, SignedClaimSubmission } from "./types.js";

export interface ClaimSigningContext {
  poolAddress: `0x${string}`;
  chainId: number;
}

export function buildClaimAuthorizationMessage(
  submission: ClaimSubmission,
  context: ClaimSigningContext,
  signedAtMs: number
): string {
  if (!submission.nonce?.trim()) {
    throw new Error("Claim submission nonce is required for authorization");
  }
  return [
    "MutualAidPool Claim Authorization",
    `Pool:${context.poolAddress}`,
    `ChainId:${context.chainId}`,
    `Claimant:${submission.claimantAddress}`,
    `AmountUsd:${submission.amountUsd}`,
    `Evidence:${submission.evidenceIpfsHash}`,
    `Description:${submission.description}`,
    `SignedAt:${Math.floor(signedAtMs / 1000)}`,
    `Nonce:${submission.nonce}`,
  ].join("\n");
}

export async function verifyClaimAuthorization(
  submission: SignedClaimSubmission,
  context: ClaimSigningContext
): Promise<boolean> {
  if (!isClaimSignatureFresh(submission.signedAt)) {
    return false;
  }
  try {
    const rebuiltMessage = buildClaimAuthorizationMessage(
      submission,
      context,
      submission.signedAt
    );
    const signer = await recoverMessageAddress({ message: rebuiltMessage, signature: submission.signature });
    return signer.toLowerCase() === submission.claimantAddress.toLowerCase();
  } catch {
    return false;
  }
}

export function isClaimSignatureFresh(
  signedAt: number,
  maxAgeMs: number = 7 * 24 * 60 * 60 * 1000
): boolean {
  return Date.now() - signedAt < maxAgeMs;
}

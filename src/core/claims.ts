import { ethers } from "ethers";
import type { ClaimSubmission, SignedClaimSubmission } from "./types.js";

export interface ClaimSigningContext {
  poolAddress: `0x${string}`;
  chainId: number;
}

export function buildClaimAuthorizationMessage(
  submission: ClaimSubmission,
  context: ClaimSigningContext
): string {
  return [
    "MutualAidPool Claim Authorization",
    `Pool:${context.poolAddress}`,
    `ChainId:${context.chainId}`,
    `Claimant:${submission.claimantAddress}`,
    `AmountUsd:${submission.amountUsd}`,
    `Evidence:${submission.evidenceIpfsHash}`,
    `Description:${submission.description}`,
    `SignedAt:${Math.floor(Date.now() / 1000)}`,
    `Nonce:${Math.random().toString(36).slice(2)}`,
  ].join("\n");
}

export function verifyClaimAuthorization(
  submission: SignedClaimSubmission,
  context: ClaimSigningContext
): boolean {
  try {
    const message = buildClaimAuthorizationMessage(submission, context);
    const signer = ethers.utils.verifyMessage(message, submission.signature);
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

import { describe, it, expect } from "vitest";
import {
  buildClaimAuthorizationMessage,
  verifyClaimAuthorization,
  isClaimSignatureFresh,
} from "../src/core/claims.js";
import type { ClaimSubmission, SignedClaimSubmission } from "../src/core/types.js";

const POOL_ADDRESS = "0x1234567890123456789012345678901234567890" as const;
const CHAIN_ID = 84532;
const CLAIMANT = "0x4444444444444444444444444444444444444444" as const;

describe("claims.ts", () => {
  describe("buildClaimAuthorizationMessage", () => {
    it("includes pool address and chain ID", () => {
      const submission: ClaimSubmission = {
        claimantAddress: CLAIMANT,
        amountUsd: 100,
        evidenceIpfsHash: "QmTest123",
        description: "Medical emergency",
      };
      const ctx = { poolAddress: POOL_ADDRESS, chainId: CHAIN_ID };
      const msg = buildClaimAuthorizationMessage(submission, ctx);

      expect(msg).toContain("MutualAidPool Claim Authorization");
      expect(msg).toContain(`Pool:${POOL_ADDRESS}`);
      expect(msg).toContain(`ChainId:${CHAIN_ID}`);
      expect(msg).toContain(`Claimant:${CLAIMANT}`);
      expect(msg).toContain("AmountUsd:100");
      expect(msg).toContain("QmTest123");
      expect(msg).toContain("Medical emergency");
    });

    it("produces different nonces each call", () => {
      const submission: ClaimSubmission = {
        claimantAddress: CLAIMANT,
        amountUsd: 50,
        evidenceIpfsHash: "QmABC",
        description: "Rent",
      };
      const ctx = { poolAddress: POOL_ADDRESS, chainId: CHAIN_ID };
      const msg1 = buildClaimAuthorizationMessage(submission, ctx);
      const msg2 = buildClaimAuthorizationMessage(submission, ctx);
      expect(msg1).not.toBe(msg2);
    });
  });

  describe("isClaimSignatureFresh", () => {
    it("returns true for fresh timestamp", () => {
      expect(isClaimSignatureFresh(Date.now())).toBe(true);
    });

    it("returns false for expired timestamp (8 days ago)", () => {
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      expect(isClaimSignatureFresh(eightDaysAgo)).toBe(false);
    });

    it("returns true within custom maxAgeMs", () => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      expect(isClaimSignatureFresh(oneHourAgo, 2 * 60 * 60 * 1000)).toBe(true);
      expect(isClaimSignatureFresh(oneHourAgo, 30 * 60 * 1000)).toBe(false);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildClaimAuthorizationMessage,
  isClaimSignatureFresh,
} from "../src/core/claims.js";
import type { ClaimSubmission } from "../src/core/types.js";

const POOL_ADDRESS = "0x1234567890123456789012345678901234567890" as const;
const CHAIN_ID = 84532;
const CLAIMANT = "0x4444444444444444444444444444444444444444" as const;

describe("claims.ts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

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

    it("rebuilds to same message when nonce is provided", () => {
      const nonce = "fixed-nonce-123";
      const submission: ClaimSubmission = {
        claimantAddress: CLAIMANT,
        amountUsd: 50,
        evidenceIpfsHash: "QmABC",
        description: "Rent",
        nonce,
      };
      const ctx = { poolAddress: POOL_ADDRESS, chainId: CHAIN_ID };
      const msg1 = buildClaimAuthorizationMessage(submission, ctx);
      const msg2 = buildClaimAuthorizationMessage(submission, ctx);
      expect(msg1).toBe(msg2);
      expect(msg1).toContain(`Nonce:${nonce}`);
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

    it("returns false for very old timestamp", () => {
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      expect(isClaimSignatureFresh(monthAgo)).toBe(false);
    });
  });
});

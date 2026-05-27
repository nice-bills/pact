import { describe, it, expect, vi, beforeEach } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";
import { localhost } from "viem/chains";
import {
  buildClaimAuthorizationMessage,
  isClaimSignatureFresh,
  verifyClaimAuthorization,
} from "../src/core/claims.js";
import type { ClaimSubmission, SignedClaimSubmission } from "../src/core/types.js";

const POOL_ADDRESS = "0x1234567890123456789012345678901234567890" as const;
const CHAIN_ID = 84532;
const CLAIMANT = "0x4444444444444444444444444444444444444444" as const;
const TEST_KEY =
  "0x0000000000000000000000000000000000000000000000000000000000000001" as const;

describe("claims.ts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("buildClaimAuthorizationMessage", () => {
    it("includes pool address and chain ID", () => {
      const signedAtMs = 1_700_000_000_000;
      const submission: ClaimSubmission = {
        claimantAddress: CLAIMANT,
        amountUsd: 100,
        evidenceIpfsHash: "QmTest123",
        description: "Medical emergency",
        nonce: "abc123",
      };
      const ctx = { poolAddress: POOL_ADDRESS, chainId: CHAIN_ID };
      const msg = buildClaimAuthorizationMessage(submission, ctx, signedAtMs);

      expect(msg).toContain("MutualAidPool Claim Authorization");
      expect(msg).toContain(`Pool:${POOL_ADDRESS}`);
      expect(msg).toContain(`ChainId:${CHAIN_ID}`);
      expect(msg).toContain(`Claimant:${CLAIMANT}`);
      expect(msg).toContain("AmountUsd:100");
      expect(msg).toContain("QmTest123");
      expect(msg).toContain("Medical emergency");
      expect(msg).toContain(`SignedAt:${Math.floor(signedAtMs / 1000)}`);
      expect(msg).toContain("Nonce:abc123");
    });

    it("rebuilds to same message when signedAt and nonce are fixed", () => {
      const signedAtMs = 1_700_000_000_000;
      const nonce = "fixed-nonce-123";
      const submission: ClaimSubmission = {
        claimantAddress: CLAIMANT,
        amountUsd: 50,
        evidenceIpfsHash: "QmABC",
        description: "Rent",
        nonce,
      };
      const ctx = { poolAddress: POOL_ADDRESS, chainId: CHAIN_ID };
      const msg1 = buildClaimAuthorizationMessage(submission, ctx, signedAtMs);
      const msg2 = buildClaimAuthorizationMessage(submission, ctx, signedAtMs);
      expect(msg1).toBe(msg2);
      expect(msg1).toContain(`Nonce:${nonce}`);
    });
  });

  describe("verifyClaimAuthorization", () => {
    it("accepts a valid sign/verify round-trip", async () => {
      const account = privateKeyToAccount(TEST_KEY);
      const signedAtMs = Date.now();
      const submission: ClaimSubmission = {
        claimantAddress: account.address,
        amountUsd: 25,
        evidenceIpfsHash: "QmRoundTrip",
        description: "Test claim",
        nonce: "roundtrip-nonce",
      };
      const ctx = { poolAddress: POOL_ADDRESS, chainId: CHAIN_ID };
      const message = buildClaimAuthorizationMessage(submission, ctx, signedAtMs);
      const walletClient = createWalletClient({
        account,
        chain: localhost,
        transport: http(),
      });
      const signature = await walletClient.signMessage({ message });

      const signedSubmission: SignedClaimSubmission = {
        ...submission,
        signedAt: signedAtMs,
        nonce: submission.nonce!,
        signature,
      };

      expect(await verifyClaimAuthorization(signedSubmission, ctx)).toBe(true);
    });

    it("rejects when signedAt drifts from the signed message", async () => {
      const account = privateKeyToAccount(TEST_KEY);
      const signedAtMs = Date.now();
      const submission: ClaimSubmission = {
        claimantAddress: account.address,
        amountUsd: 25,
        evidenceIpfsHash: "QmRoundTrip",
        description: "Test claim",
        nonce: "roundtrip-nonce",
      };
      const ctx = { poolAddress: POOL_ADDRESS, chainId: CHAIN_ID };
      const message = buildClaimAuthorizationMessage(submission, ctx, signedAtMs);
      const walletClient = createWalletClient({
        account,
        chain: localhost,
        transport: http(),
      });
      const signature = await walletClient.signMessage({ message });

      const signedSubmission: SignedClaimSubmission = {
        ...submission,
        signedAt: signedAtMs + 1000,
        nonce: submission.nonce!,
        signature,
      };

      expect(await verifyClaimAuthorization(signedSubmission, ctx)).toBe(false);
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

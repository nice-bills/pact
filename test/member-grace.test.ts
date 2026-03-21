import { describe, it, expect } from "vitest";
import { MutualAidPool, MEMBER_STREAM_GRACE_PERIOD_MS } from "../src/core/pool.js";
import type { PoolConfig } from "../src/core/types.js";

const TEST_CONFIG: PoolConfig = {
  safeAddress: "0x0000000000000000000000000000000000000001",
  agenticCommerceAddress: "0x0000000000000000000000000000000000000002",
  paymentTokenAddress: "0x0000000000000000000000000000000000000003",
  chainId: 84532,
  rpcUrl: "https://sepolia.base.org",
  threshold: 2,
  monthlyContributionUsd: 5,
  superfluidHost: "0x109412E3C84f0539b43d39dB691B08c90f58dC7c",
  superTokenAddress: "0x2C4608e5E9bEcf46096Fc4E8A4524dAF0e59954b",
};

const TEST_KEY = "0x0000000000000000000000000000000000000000000000000000000000000001" as const;
const ALICE = "0x1111111111111111111111111111111111111111" as const;

function makePool() {
  return new MutualAidPool(TEST_CONFIG, TEST_KEY);
}

describe("member-grace.test.ts", () => {
  describe("MEMBER_STREAM_GRACE_PERIOD_MS", () => {
    it("is 7 days in milliseconds", () => {
      expect(MEMBER_STREAM_GRACE_PERIOD_MS).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe("hasClaimAccess", () => {
    it("returns false for non-members", () => {
      const pool = makePool();
      expect(pool.hasClaimAccess(ALICE)).toBe(false);
    });

    it("returns true for member with active stream", () => {
      const pool = makePool();
      pool.addFoundingMember(ALICE);
      pool.setMemberStreamStatus(ALICE, true);
      expect(pool.hasClaimAccess(ALICE)).toBe(true);
    });

    it("returns true for member within grace period", () => {
      const pool = makePool();
      pool.addFoundingMember(ALICE);
      pool.setMemberStreamStatus(ALICE, false);
      expect(pool.hasClaimAccess(ALICE)).toBe(true);
    });

    it("returns false for member after grace period expires", () => {
      const pool = makePool();
      pool.addFoundingMember(ALICE);
      const expired = Date.now() - MEMBER_STREAM_GRACE_PERIOD_MS - 1;
      pool.setMemberStreamStatus(ALICE, false, expired);
      expect(pool.hasClaimAccess(ALICE, Date.now())).toBe(false);
    });
  });

  describe("getClaimantClass", () => {
    it("returns outsider for unknown address", () => {
      const pool = makePool();
      expect(pool.getClaimantClass(ALICE)).toBe("outsider");
    });

    it("returns member for active stream", () => {
      const pool = makePool();
      pool.addFoundingMember(ALICE);
      pool.setMemberStreamStatus(ALICE, true);
      expect(pool.getClaimantClass(ALICE)).toBe("member");
    });

    it("returns grace when stream inactive but within grace", () => {
      const pool = makePool();
      pool.addFoundingMember(ALICE);
      pool.setMemberStreamStatus(ALICE, false);
      expect(pool.getClaimantClass(ALICE)).toBe("grace");
    });
  });
});

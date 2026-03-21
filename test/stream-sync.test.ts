import { describe, it, expect, vi, beforeEach } from "vitest";
import { MutualAidPool } from "../src/core/pool.js";
import type { PoolConfig, StreamInfoFn } from "../src/core/types.js";
import type { StreamInfoFn as ExportedStreamInfoFn } from "../src/core/pool.js";

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
const BOB = "0x2222222222222222222222222222222222222222" as const;
const CAROL = "0x3333333333333333333333333333333333333333" as const;

function makePool(getStreamInfoFn?: ExportedStreamInfoFn) {
  return new MutualAidPool(TEST_CONFIG, TEST_KEY, getStreamInfoFn);
}

const activeStream: StreamInfoFn = async () => ({ flowRate: "1000", active: true });
const inactiveStream: StreamInfoFn = async () => ({ flowRate: "0", active: false });
const errorStream: StreamInfoFn = async () => { throw new Error("RPC timeout"); };

describe("stream-sync.test.ts", () => {
  describe("syncMemberStream", () => {
    it("sets streamActive=true when Superfluid stream is active", async () => {
      const pool = makePool(activeStream);
      pool.addFoundingMember(ALICE);

      await pool.syncMemberStream(ALICE);

      expect(pool.hasClaimAccess(ALICE)).toBe(true);
    });

    it("sets streamActive=false and starts grace when stream is inactive", async () => {
      const pool = makePool(inactiveStream);
      pool.addFoundingMember(ALICE);

      await pool.syncMemberStream(ALICE);

      expect(pool.getClaimantClass(ALICE)).toBe("grace");
    });

    it("returns false and does not throw when RPC fails", async () => {
      const pool = makePool(errorStream);
      pool.addFoundingMember(ALICE);

      const result = await pool.syncMemberStream(ALICE);

      expect(result).toBe(false);
    });

    it("returns false for non-members", async () => {
      const pool = makePool(activeStream);
      const result = await pool.syncMemberStream(ALICE);
      expect(result).toBe(false);
    });
  });

  describe("syncAllMemberStreams", () => {
    it("syncs all members concurrently", async () => {
      const streams = {
        [ALICE]: async () => ({ flowRate: "1000", active: true }),
        [BOB]: async () => ({ flowRate: "0", active: false }),
        [CAROL]: async () => ({ flowRate: "1000", active: true }),
      };

      const getStreamInfoFn: ExportedStreamInfoFn = async (rpcUrl, sender) => {
        return streams[sender as keyof typeof streams]();
      };

      const pool = makePool(getStreamInfoFn);
      pool.addFoundingMember(ALICE);
      pool.addFoundingMember(BOB);
      pool.addFoundingMember(CAROL);

      await pool.syncAllMemberStreams();

      expect(pool.getClaimantClass(ALICE)).toBe("member");
      expect(pool.getClaimantClass(BOB)).toBe("grace");
      expect(pool.getClaimantClass(CAROL)).toBe("member");
    });
  });

  describe("getClaimantClassWithSync", () => {
    it("syncs then returns claimant class", async () => {
      const pool = makePool(activeStream);
      pool.addFoundingMember(ALICE);

      const cls = await pool.getClaimantClassWithSync(ALICE);

      expect(cls).toBe("member");
    });
  });

  describe("hasClaimAccessWithSync", () => {
    it("syncs then returns claim access", async () => {
      const pool = makePool(inactiveStream);
      pool.addFoundingMember(ALICE);

      const access = await pool.hasClaimAccessWithSync(ALICE);

      expect(access).toBe(true);
    });
  });
});

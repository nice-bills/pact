import { describe, it, expect } from "vitest";
import { encodeAbiParameters, encodeEventTopics } from "viem";
import { AGENTIC_COMMERCE_ABI } from "../src/core/abi.js";
import { MutualAidPool } from "../src/core/pool.js";
import type { PoolConfig } from "../src/core/types.js";

const TEST_CONFIG: PoolConfig = {
  safeAddress: "0x0000000000000000000000000000000000000001",
  agenticCommerceAddress: "0x0000000000000000000000000000000000000002",
  paymentTokenAddress: "0x0000000000000000000000000000000000000003",
  chainId: 84532,
  rpcUrl: "https://sepolia.base.org",
  threshold: 2,
  monthlyContributionUsd: 5,
};

const TEST_KEY =
  "0x0000000000000000000000000000000000000000000000000000000000000001" as const;

describe("MutualAidPool.extractJobId", () => {
  it("parses JobCreated from receipt logs", () => {
    const pool = new MutualAidPool(TEST_CONFIG, TEST_KEY);
    const jobId = 42n;
    const extractJobId = (
      pool as unknown as {
        extractJobId: (
          logs: readonly {
            topics: readonly `0x${string}`[];
            address: `0x${string}`;
            data: `0x${string}`;
          }[]
        ) => bigint;
      }
    ).extractJobId.bind(pool);

    const client = "0x1111111111111111111111111111111111111111";
    const provider = "0x2222222222222222222222222222222222222222";
    const evaluator = "0x3333333333333333333333333333333333333333";
    const expiredAt = 9999999999n;
    const topics = encodeEventTopics({
      abi: AGENTIC_COMMERCE_ABI,
      eventName: "JobCreated",
      args: { jobId },
    });
    const data = encodeAbiParameters(
      [
        { name: "client", type: "address" },
        { name: "provider", type: "address" },
        { name: "evaluator", type: "address" },
        { name: "expiredAt", type: "uint256" },
      ],
      [client, provider, evaluator, expiredAt]
    );

    const logs = [
      {
        address: TEST_CONFIG.agenticCommerceAddress,
        topics,
        data,
      },
    ];

    expect(extractJobId(logs)).toBe(jobId);
  });

  it("rejects logs from a different contract address", () => {
    const pool = new MutualAidPool(TEST_CONFIG, TEST_KEY);
    const extractJobId = (
      pool as unknown as {
        extractJobId: (
          logs: readonly {
            topics: readonly `0x${string}`[];
            address: `0x${string}`;
            data: `0x${string}`;
          }[]
        ) => bigint;
      }
    ).extractJobId.bind(pool);

    const client = "0x1111111111111111111111111111111111111111";
    const provider = "0x2222222222222222222222222222222222222222";
    const evaluator = "0x3333333333333333333333333333333333333333";
    const expiredAt = 9999999999n;
    const topics = encodeEventTopics({
      abi: AGENTIC_COMMERCE_ABI,
      eventName: "JobCreated",
      args: { jobId: 2n },
    });
    const data = encodeAbiParameters(
      [
        { name: "client", type: "address" },
        { name: "provider", type: "address" },
        { name: "evaluator", type: "address" },
        { name: "expiredAt", type: "uint256" },
      ],
      [client, provider, evaluator, expiredAt]
    );

    expect(() =>
      extractJobId([
        {
          address: "0x9999999999999999999999999999999999999999",
          topics,
          data,
        },
      ])
    ).toThrow(/JobCreated event not found/);
  });
});

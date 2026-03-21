import { describe, it, expect, vi, beforeEach } from "vitest";
import { evaluateClaim } from "../src/agent/evaluator.js";
import type { ClaimSubmission } from "../src/core/types.js";

const SUBMISSION: ClaimSubmission = {
  claimantAddress: "0x4444444444444444444444444444444444444444" as const,
  amountUsd: 80,
  evidenceIpfsHash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
  description: "Hospital bill for son's medication",
};

describe("evaluator.ts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a valid AgentRecommendation shape", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"approve":true,"confidence":85,"reasoning":"Reasonable emergency"}' } }],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await evaluateClaim(SUBMISSION, "test-key");

    expect(result).toHaveProperty("approve");
    expect(result).toHaveProperty("confidence");
    expect(result).toHaveProperty("reasoning");
    expect(result).toHaveProperty("evaluatedAt");
    expect(typeof result.approve).toBe("boolean");
    expect(typeof result.confidence).toBe("number");
    expect(typeof result.reasoning).toBe("string");
  });

  it("parses approve=true from response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"approve":true,"confidence":92,"reasoning":"Legitimate claim"}' } }],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await evaluateClaim(SUBMISSION, "test-key");
    expect(result.approve).toBe(true);
    expect(result.confidence).toBe(92);
  });

  it("parses approve=false from response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"approve":false,"confidence":20,"reasoning":"Vague description"}' } }],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await evaluateClaim(SUBMISSION, "test-key");
    expect(result.approve).toBe(false);
    expect(result.confidence).toBe(20);
  });

  it("defaults confidence to 50 on malformed number", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"approve":true,"confidence":"high","reasoning":"ok"}' } }],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await evaluateClaim(SUBMISSION, "test-key");
    expect(result.confidence).toBe(50);
  });

  it("returns manual-review fallback on API error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await evaluateClaim(SUBMISSION, "bad-key");
    expect(result.approve).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.reasoning).toContain("Evaluation failed");
  });
});

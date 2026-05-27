import { describe, expect, it } from "vitest";
import {
  formatClaimRow,
  jobRecordToClaim,
  mapJobStatus,
  parseClaimDescription,
} from "../src/core/claims-list.js";

describe("claims-list", () => {
  it("maps on-chain status indices to claim status strings", () => {
    expect(mapJobStatus(0)).toBe("open");
    expect(mapJobStatus(2)).toBe("submitted");
    expect(mapJobStatus(3)).toBe("completed");
  });

  it("parses structured claim descriptions from createClaim", () => {
    const description =
      "Claimant:0xabc | Class:member | AmountUsd:25 | Evidence:QmHash | Reason:Hospital bill";
    const parsed = parseClaimDescription(description);
    expect(parsed.claimant).toBe("0xabc");
    expect(parsed.claimantClass).toBe("member");
    expect(parsed.amountUsd).toBe(25);
    expect(parsed.evidence).toBe("QmHash");
    expect(parsed.reason).toBe("Hospital bill");
  });

  it("converts an on-chain job struct into a Claim", () => {
    const claim = jobRecordToClaim({
      id: 3n,
      client: "0x1111111111111111111111111111111111111111",
      provider: "0x2222222222222222222222222222222222222222",
      evaluator: "0x3333333333333333333333333333333333333333",
      description:
        "Claimant:0x2222222222222222222222222222222222222222 | Class:grace | AmountUsd:5 | Evidence:ipfs://abc | Reason:Emergency",
      budget: 5_000_000n,
      expiredAt: 1_700_000_000n,
      status: 2,
    });
    expect(claim.id).toBe(3n);
    expect(claim.status).toBe("submitted");
    expect(claim.description).toBe("Emergency");
    expect(claim.evidenceIpfsHash).toBe("ipfs://abc");
    expect(claim.isMember).toBe(false);
  });

  it("formats a table row for CLI output", () => {
    const row = formatClaimRow({
      id: 1n,
      claimant: "0x2222222222222222222222222222222222222222",
      amountRequested: 5_000_000n,
      evidenceIpfsHash: "QmEvidenceHash",
      description: "Short desc",
      isMember: true,
      status: "funded",
      expiredAt: 0,
    });
    expect(row).toContain("funded");
    expect(row).toContain("$5.00");
  });
});

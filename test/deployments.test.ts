import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadDeployments,
  resetDeploymentsCache,
  resolveAgenticCommerceAddress,
} from "../src/core/deployments.js";

describe("deployments", () => {
  const originalEnv = process.env.AGENTIC_COMMERCE_ADDRESS;

  afterEach(() => {
    resetDeploymentsCache();
    if (originalEnv === undefined) {
      delete process.env.AGENTIC_COMMERCE_ADDRESS;
    } else {
      process.env.AGENTIC_COMMERCE_ADDRESS = originalEnv;
    }
  });

  it("loads config/deployments.json from the repo", () => {
    const deployments = loadDeployments();
    expect(deployments["base-sepolia"]?.erc8183).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("prefers AGENTIC_COMMERCE_ADDRESS from the environment", () => {
    process.env.AGENTIC_COMMERCE_ADDRESS = "0x00000000000000000000000000000000000000AB";
    expect(resolveAgenticCommerceAddress("base-sepolia", 84532)).toBe(
      "0x00000000000000000000000000000000000000AB"
    );
  });

  it("falls back to deployments.json when env is unset", () => {
    delete process.env.AGENTIC_COMMERCE_ADDRESS;
    resetDeploymentsCache();
    const address = resolveAgenticCommerceAddress("base-sepolia", 84532);
    expect(address).toBe("0x76Dd9C55D9a2e4B36219b4cC749deEF8324333e6");
  });

  it("resolves by chain id when chain name key is missing", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pact-deploy-"));
    const configDir = path.join(tmp, "config");
    fs.mkdirSync(configDir);
    fs.writeFileSync(
      path.join(configDir, "deployments.json"),
      JSON.stringify({
        custom: { chainId: 99999, erc8183: "0x1111111111111111111111111111111111111111" },
      })
    );
    delete process.env.AGENTIC_COMMERCE_ADDRESS;
    resetDeploymentsCache();
    expect(resolveAgenticCommerceAddress("unknown-chain", 99999, tmp)).toBe(
      "0x1111111111111111111111111111111111111111"
    );
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});

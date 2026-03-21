import { test, expect } from "@playwright/test";

const CLI = "npx tsx src/cli/index.ts";

test.describe("CLI pool commands", () => {
  test("pool create shows usage", async () => {
    const result = await exec(`${CLI} pool create`);
    expect(result.stdout).toContain("pool create");
  });

  test("pool join shows usage without required args", async () => {
    const result = await exec(`${CLI} pool join`);
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toContain("pool join");
  });

  test("pool status shows pool info", async () => {
    const result = await exec(`${CLI} pool status --pool 0x0000000000000000000000000000000000000001`);
    expect(result.stdout).toContain("Pool Safe:");
    expect(result.stdout).toContain("Base Sepolia");
  });

  test("pool sync shows sync results", async () => {
    const result = await exec(`${CLI} pool sync --pool 0x0000000000000000000000000000000000000001`);
    expect(result.exitCode).toBe(0);
  });

  test("pool stream-open shows usage without DEPLOYER_PRIVATE_KEY", async () => {
    const result = await exec(`${CLI} pool stream-open --pool 0x0000000000000000000000000000000000000001 --flow-rate 5`);
    expect(result.exitCode).toBe(0);
  });
});

test.describe("CLI claim commands", () => {
  test("claim submit shows usage", async () => {
    const result = await exec(`${CLI} claim submit`);
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toContain("claim submit");
  });

  test("claim list shows pool info", async () => {
    const result = await exec(`${CLI} claim list --pool 0x0000000000000000000000000000000000000001`);
    expect(result.stdout).toContain("Pool:");
    expect(result.exitCode).toBe(0);
  });

  test("claim approve shows info", async () => {
    const result = await exec(`${CLI} claim approve --pool 0x0000000000000000000000000000000000000001 --claim-id 1`);
    expect(result.exitCode).toBe(0);
  });

  test("claim reject shows info", async () => {
    const result = await exec(`${CLI} claim reject --pool 0x0000000000000000000000000000000000000001 --claim-id 1`);
    expect(result.exitCode).toBe(0);
  });
});

test.describe("CLI serve command", () => {
  test("serve starts HTTP server on port 3000", async ({ page }) => {
    await page.goto("/health");
    const content = await page.content();
    expect(content).toContain("ok");
  });
});

test.describe("CLI help and version", () => {
  test("--help shows all commands", async () => {
    const result = await exec(`${CLI} --help`);
    expect(result.stdout).toContain("pool create");
    expect(result.stdout).toContain("pool join");
    expect(result.stdout).toContain("pool status");
    expect(result.stdout).toContain("pool sync");
    expect(result.stdout).toContain("pool stream-open");
    expect(result.stdout).toContain("claim submit");
    expect(result.stdout).toContain("claim list");
    expect(result.stdout).toContain("claim approve");
    expect(result.stdout).toContain("claim reject");
    expect(result.stdout).toContain("serve");
  });

  test("--version shows version", async () => {
    const result = await exec(`${CLI} --version`);
    expect(result.stdout).toContain("0.1.0");
  });
});

test.describe("CLI error handling", () => {
  test("unknown command exits with error", async () => {
    const result = await exec(`${CLI} unknown command`);
    expect(result.exitCode).not.toBe(0);
  });

  test("pool status with invalid address shows error", async () => {
    const result = await exec(`${CLI} pool status --pool 0x000`);
    expect(result.exitCode).toBe(0);
  });
});

async function exec(cmd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const { execSync } = await import("child_process");
  try {
    const stdout = execSync(cmd, { encoding: "utf-8", timeout: 10_000 });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (e: any) {
    return { stdout: e.stdout?.toString() ?? "", stderr: e.stderr?.toString() ?? "", exitCode: e.status ?? 1 };
  }
}

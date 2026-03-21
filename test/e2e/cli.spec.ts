import { test, expect } from "@playwright/test";

const CLI = "npx tsx src/cli/index.ts";

const hasPrivateKey = !!process.env.DEPLOYER_PRIVATE_KEY;
const hasRpc = !!process.env.BASE_SEPOLIA_RPC || !!process.env.RPC_URL;
const isIntegrationEnabled = hasPrivateKey && hasRpc;

test.describe("CLI structure tests", () => {
  test("--help shows all commands", async () => {
    const result = await exec(`${CLI} --help`);
    expect(result.stdout).toContain("pool");
    expect(result.stdout).toContain("claim");
    expect(result.stdout).toContain("serve");
    expect(result.exitCode).toBe(0);
  });

  test("--version shows version", async () => {
    const result = await exec(`${CLI} --version`);
    expect(result.stdout).toContain("0.1.0");
    expect(result.exitCode).toBe(0);
  });

  test("unknown command exits with error", async () => {
    const result = await exec(`${CLI} unknown command`);
    expect(result.exitCode).not.toBe(0);
  });

  test("pool help shows pool subcommands", async () => {
    const result = await exec(`${CLI} pool --help`);
    expect(result.stdout).toContain("create");
    expect(result.stdout).toContain("join");
    expect(result.stdout).toContain("status");
    expect(result.stdout).toContain("sync");
    expect(result.exitCode).toBe(0);
  });

  test("claim help shows claim subcommands", async () => {
    const result = await exec(`${CLI} claim --help`);
    expect(result.stdout).toContain("submit");
    expect(result.stdout).toContain("list");
    expect(result.stdout).toContain("approve");
    expect(result.stdout).toContain("reject");
    expect(result.exitCode).toBe(0);
  });

  test("pool create shows required flags", async () => {
    const result = await exec(`${CLI} pool create`);
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toContain("--name");
    expect(result.stdout).toContain("--threshold");
    expect(result.stdout).toContain("--members");
  });

  test("claim submit shows required flags", async () => {
    const result = await exec(`${CLI} claim submit`);
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toContain("--pool");
    expect(result.stdout).toContain("--amount");
    expect(result.stdout).toContain("--evidence");
    expect(result.stdout).toContain("--description");
  });
});

test.describe("CLI serve", () => {
  test("serve starts HTTP server on port 3000", async ({ page }) => {
    await page.goto("/health");
    const content = await page.content();
    expect(content).toContain("ok");
  });
});

if (isIntegrationEnabled) {
  test.describe("CLI integration tests", () => {
    const pool = process.env.POOL_SAFE_ADDRESS ?? "0x0000000000000000000000000000000000000001";

    test("pool status with valid pool shows info", async () => {
      const result = await exec(`${CLI} pool status --pool ${pool}`);
      expect(result.stdout).toContain("Pool Safe:");
    });

    test("pool sync completes without error", async () => {
      const result = await exec(`${CLI} pool sync --pool ${pool}`);
      expect(result.exitCode).toBe(0);
    });
  });
}

async function exec(cmd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const { execSync } = await import("child_process");
  try {
    const stdout = execSync(cmd, { encoding: "utf-8", timeout: 15_000, env: { ...process.env, NODE_OPTIONS: "" } });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (e: any) {
    return { stdout: e.stdout?.toString() ?? "", stderr: e.stderr?.toString() ?? "", exitCode: e.status ?? 1 };
  }
}

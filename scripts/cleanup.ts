import * as fs from "fs";
import * as path from "path";

async function main() {
  const dirs = [
    "dist",
    "node_modules/.cache",
    "playwright-report",
    "test-results",
  ];

  console.log("=== Cleanup Script ===\n");

  for (const dir of dirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`Removed: ${dir}`);
    } else {
      console.log(`Not found (skipping): ${dir}`);
    }
  }

  console.log("\nCleanup complete.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });

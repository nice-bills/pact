# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Mutual Aid Pool is a TypeScript + Solidity project — an agent-managed community emergency fund. No database, no frontend; the core is a protocol SDK/library, CLI, Solidity smart contracts, and MCP servers.

### Key commands

All commands are in `package.json`. The essentials:

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Build | `npm run build` (runs `tsc`) |
| Lint / type-check | `npm run lint` (runs `tsc --noEmit`) |
| Unit tests | `npm run test` (31 Vitest tests) |
| Solidity tests | `npm run test:sol` or `forge test` (26 Forge tests) |
| Dev mode (watch) | `npm run dev` |
| HTTP server | `npm run serve` (port 3000, `/health` endpoint) |
| CLI | `npx tsx src/cli/index.ts <pool|claim> ...` |

### Non-obvious notes

- **Foundry must be installed** for `forge test` / `npm run test:sol`. It is not an npm dependency. Install via `curl -L https://foundry.paradigm.xyz | bash && $HOME/.foundry/bin/foundryup`. Ensure `$HOME/.foundry/bin` is on `PATH`.
- **`.env` file**: Copy `.env.example` to `.env` before running deploy/demo scripts. The `DEPLOYER_PRIVATE_KEY` is required for any on-chain transaction but NOT required for build, lint, or unit tests.
- **`npm run dev`** runs `tsx watch src/index.ts` which simply re-exports the library — it does not start an HTTP server. Use `npm run serve` for the HTTP server.
- **MCP servers** (`npm run mcp:lido`, `npm run mcp:vault`) are standalone and communicate via stdio, not HTTP.
- **E2E tests** (`npm run test:e2e`) require Playwright and a running server on port 3000 (`npm run serve` in a separate terminal first).
- **tsconfig.json** excludes `src/mcp` from compilation. MCP server files are run directly via `tsx`.

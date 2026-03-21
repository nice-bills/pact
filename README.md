# Mutual Aid Pool

Agent-managed mutual aid fund using **ERC-8183**, **ERC-8004**, **Safe multisig**, and **Superfluid** on **Base Sepolia**.

## Stack

- **Contracts**: ERC-8183 (AgenticCommerce), Safe Module, Superfluid USDCx
- **Chain**: Base Sepolia
- **Language**: TypeScript (Node.js)
- **Test**: Vitest + Playwright E2E
- **Container**: Docker + docker-compose

## Quick Start

```bash
cp .env.example .env  # fill in keys
npm install
npm run build
npm run test
npm run demo
```

## Deploy

```bash
# Deploy ERC-8183 + Safe
npx tsx src/deploy/deploy-all.ts

# Or step by step
npx hardhat run scripts/deploy-agentic-commerce.ts
npx tsx src/deploy/create-safe.ts
```

## CLI

```bash
# Pool management
npx tsx src/cli/index.ts pool status --pool <address>
npx tsx src/cli/index.ts pool sync --pool <address>

# Claims
npx tsx src/cli/index.ts claim submit --pool <address> --amount 80 --evidence QmXxx --description "Hospital bill"
npx tsx src/cli/index.ts claim list --pool <address>

# Health server
npx tsx src/cli/index.ts serve --port 3000
```

## Architecture

- `src/core/pool.ts` — MutualAidPool class (claims, streams, multisig)
- `src/core/claims.ts` — Claim authorization message signing/verification
- `src/core/streaming.ts` — Superfluid stream management
- `src/agent/evaluator.ts` — MiniMax M2.5 claim evaluation
- `src/deploy/` — Deployment scripts
- `scripts/` — Verification and cleanup scripts
- `test/` — Unit and E2E tests

## Testing

```bash
npm run test          # unit tests
npm run test:e2e      # Playwright E2E tests
npm run lint && npm run test && npm run build  # full verification
```

## Docker

```bash
docker-compose up --build
```

# Mutual Aid Pool

Agent-managed mutual aid fund using **ERC-8183**, **ERC-8004**, **Safe multisig**, and **Superfluid** / **x402** on **Base Sepolia** and **Avalanche Fuji**.

## Stack

- **Contracts**: ERC-8183 (AgenticCommerce), ERC-8004 (IdentityRegistry), Safe multisig treasury
- **Chains**: Base Sepolia (development) + Avalanche Fuji (hackathon track)
- **Payments**: x402 HTTP payment protocol on Avalanche; Superfluid USDCx on Base
- **Identity**: ERC-8004 trustless agent registry
- **AI**: MiniMax M2.5 claim evaluation (with GenLayer Intelligent Contract fallback)
- **Language**: TypeScript (Node.js) + Python (GenLayer IC)
- **Test**: Vitest 37 tests + Playwright E2E
- **Container**: Docker + docker-compose

## Supported Hackathon Tracks

- **PL_Genesis + Crecimiento** — social impact, crypto + AI
- **Avalanche** — ERC-8004 identity + x402 payment protocol for AI agents
- **GenLayer** — AI consensus evaluation via Python Intelligent Contract

## Quick Start

```bash
cp .env.example .env  # fill in keys
npm install
npm run build
npm run test
npm run demo         # live demo with on-chain transactions
```

## Chain Configuration

```bash
# Base Sepolia (default)
export CHAIN_NAME=base-sepolia
export BASE_SEPOLIA_RPC=https://sepolia.base.org

# Avalanche Fuji (hackathon track)
export CHAIN_NAME=avalanche-fuji
export AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
```

## Deploy

```bash
# 1. Deploy ERC-8183 AgenticCommerce
npm run deploy:erc8183
# After deployment, set AGENTIC_COMMERCE_ADDRESS in .env

# 2. Deploy Safe multisig
npm run deploy:safe
# After deployment, set POOL_SAFE_ADDRESS in .env

# 3. Verify deployment
npm run verify

# Full deploy (prints instructions)
npm run deploy:all

# Avalanche Fuji
export CHAIN_NAME=avalanche-fuji
npm run deploy:erc8183
npm run deploy:safe
```

## GenLayer Track

Deploy the Python Intelligent Contract on Bradbury testnet:

```bash
pip install py-genlayer
genlayer network testnet-bradbury
python scripts/deploy_genlayer_ic.py --owner <address> --min-confidence 50
```

Then set `GENLAYER_IC_ADDRESS` in `.env` to enable AI consensus evaluation.

See [`genlayer/README.md`](genlayer/README.md) for full details.

## CLI Commands

```bash
# Pool management
npx tsx src/cli/index.ts pool status --pool <address>
npx tsx src/cli/index.ts pool sync --pool <address>
npx tsx src/cli/index.ts pool stream-open --pool <address> --flow-rate 5

# Claims (auto-creates on-chain job if AI approves)
npx tsx src/cli/index.ts claim submit --pool <address> --amount 80 \
  --evidence QmXxx --description "Hospital bill"

npx tsx src/cli/index.ts claim approve --pool <address> --claim-id 1
npx tsx src/cli/index.ts claim reject --pool <address> --claim-id 1

# Health server
npx tsx src/cli/index.ts serve --port 3000
```

## Architecture

| File | Purpose |
|------|---------|
| `src/core/pool.ts` | MutualAidPool — ERC-8183 claims, Safe multisig, stream sync, vouching |
| `src/core/claims.ts` | Claim authorization — build/verify messages, signature validation |
| `src/core/streaming.ts` | Superfluid USDCx stream management (viem) |
| `src/core/config.ts` | Multi-chain config — CHAIN_NAME env var switches chains |
| `src/core/x402.ts` | x402 HTTP payment protocol client for Avalanche |
| `src/core/erc8004.ts` | ERC-8004 identity registry integration |
| `src/agent/evaluator.ts` | MiniMax M2.5 + GenLayer IC + fallback chain |
| `src/cli/` | Commander CLI — pool/claim/serve commands |
| `src/deploy/` | Deployment scripts for ERC-8183, Safe, multi-chain |
| `genlayer/ClaimEvaluator.py` | GenLayer Intelligent Contract (Python) |
| `scripts/deploy_genlayer_ic.py` | GenLayer IC deployment script |
| `contracts/ERC8004IdentityRegistry.sol` | ERC-8004 reference implementation |
| `test/` | 37 unit tests + Playwright E2E |

## Testing

```bash
npm run test          # 37 unit tests
npm run test:e2e     # Playwright E2E
npm run lint          # TypeScript type check
npm run build         # Compile TypeScript
npm run lint && npm run test && npm run build  # full verification
```

## Demo

```bash
npm run demo   # Live demo: creates on-chain claim job, AI evaluates, committee approves
```

The demo shows the full ERC-8183 lifecycle:
1. Pool initializes with Safe + ERC-8183 addresses
2. Members registered and streams synced
3. Claim submitted with AI evaluation
4. On-chain job created (if approved)
5. Committee approval and completion

## Security Features

- **Claim amount cap**: $10,000 per incident
- **Grace period**: 7-day stream grace after cancellation
- **Vouching**: Only active members can vouch
- **Signature freshness**: 7-day max age on claim signatures
- **Non-deterministic AI fallback**: If all evaluators fail, claim is flagged for manual review (not auto-denied)
- **Nonce-resilient**: Transaction retries on nonce conflicts

## Docker

```bash
docker-compose up --build
```

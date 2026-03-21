# Mutual Aid Pool

Agent-managed mutual aid fund using **ERC-8183**, **ERC-8004**, **Safe multisig**, and **Superfluid** / **x402** on **Base Sepolia** and **Avalanche Fuji**.

## Stack

- **Contracts**: ERC-8183 (AgenticCommerce), Safe multisig treasury
- **Chains**: Base Sepolia (development) + Avalanche Fuji (hackathon track)
- **Payments**: x402 HTTP payment protocol on Avalanche; Superfluid USDCx on Base
- **Identity**: ERC-8004 trustless agent registry
- **AI**: MiniMax M2.5 claim evaluation via autonomous AI agent
- **Language**: TypeScript (Node.js)
- **Test**: Vitest + Playwright E2E
- **Container**: Docker + docker-compose

## Supported Hackathon Tracks

- **PL_Genesis + Crecimiento** — social impact, crypto + AI
- **Avalanche** — ERC-8004 + x402 payment protocol for AI agents
- **GenLayer** — AI consensus evaluation (Intelligent Contract)

## Quick Start

```bash
cp .env.example .env  # fill in keys
npm install
npm run build
npm run test
```

### Avalanche Track Setup

```bash
export CHAIN_NAME=avalanche-fuji
export AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
export AGENTIC_COMMERCE_ADDRESS=<deployed address>
export POOL_SAFE_ADDRESS=<deployed address>
```

## Deploy

```bash
# Base Sepolia
npx hardhat run scripts/deploy-agentic-commerce.ts
npm run deploy:safe

# Avalanche Fuji (set CHAIN_NAME=avalanche-fuji first)
export CHAIN_NAME=avalanche-fuji
npx hardhat run scripts/deploy-agentic-commerce.ts --network avalanche-fuji

# GenLayer Bradbury (Python IC)
pip install py-genlayer
genlayer network testnet-bradbury
python scripts/deploy_genlayer_ic.py --owner <address> --min-confidence 50
```

## GenLayer Track

The **GenLayer Intelligent Contract** (`genlayer/ClaimEvaluator.py`) provides AI consensus-based claim evaluation on Bradbury testnet.

- **Equivalence Principle**: leader/validator pattern — validators agree on `approve/reject` verdict but reasoning may differ
- **LLM consensus**: `gl.nondet.exec_prompt` + `gl.vm.run_nondet_unsafe` for non-deterministic evaluation
- **JSON output**: strict parsing with regex fallback on malformed responses
- **Deployment**: `python scripts/deploy_genlayer_ic.py`
- **Integration**: Set `CLAIM_EVALUATOR_ADDRESS` after deployment; TypeScript evaluator proxies via `CLAIM_EVALUATOR_URL`

See [`genlayer/README.md`](genlayer/README.md) for full details.

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

- `src/core/pool.ts` — MutualAidPool (ERC-8183 claims, Safe multisig, stream sync)
- `src/core/claims.ts` — Claim authorization signing/verification
- `src/core/streaming.ts` — Superfluid USDCx stream management
- `src/core/config.ts` — Multi-chain config (Base Sepolia + Avalanche Fuji)
- `src/agent/evaluator.ts` — MiniMax M2.5 AI claim evaluation (with GenLayer IC fallback)
- `src/deploy/` — Deployment scripts for both chains
- `genlayer/ClaimEvaluator.py` — GenLayer Intelligent Contract (Python, Bradbury testnet)
- `scripts/deploy_genlayer_ic.py` — GenLayer IC deployment script
- `scripts/` — Verification and cleanup scripts
- `test/` — Unit (25 tests) and E2E tests

## Testing

```bash
npm run test           # unit tests (25 passing)
npm run test:e2e      # Playwright E2E tests
npm run lint && npm run test && npm run build  # full verification
```

## Docker

```bash
docker-compose up --build
```

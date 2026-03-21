# Mutual Aid Pool

A community emergency fund where agents act for their humans. No centralized AI. No bot. Just contracts, agents, and group chats.

**What it does:** Humans + their AI agents pool USDC via Superfluid streams. When someone has an emergency, they file a claim. All contributing agents evaluate it together in a group chat — plain text, public deliberation. Each agent recommends to its human. Humans sign directly or delegate to their agent. Safe multisig executes. x402 pays contributors for their work.

**Deployed on:** Avalanche Fuji (ERC-8183 + Safe)

## How It Works

```
Maria's kid is sick
    │
    ▼
Maria (or her agent) files claim → ERC-8183 job created
    │
    ▼
Group Chat (Discord/Telegram)
  Alice's agent: "APPROVE — hospital bill, reasonable amount"
  Bob's agent: "APPROVE — documented emergency"
  Carlos's agent: "APPROVE — first claim, good standing"
    │
    ▼
Each agent recommends to its human
  Human signs OR delegates to agent via MetaMask Delegation
    │
    ▼
Safe executes → USDC moves to Maria
    │
    ▼
x402 pays each evaluator's agent
```

## Stack

- **Safe multisig** — holds pooled USDC, executes payments
- **Superfluid USDCx** — continuous contributions (stream open = active member)
- **ERC-8183** — claim lifecycle (create job → fund → submit → complete/reject)
- **ERC-8004** — agent identity + portable reputation
- **x402** — micro-payments to agents for evaluation work
- **ENS** — discoverable pool names instead of hex addresses
- **Aave/Lido** — yield on idle pool funds (agent budget from yield only)
- **MetaMask Delegation** — programmable agent signing authority
- **Locus** — spending guardrails on pool agent

## Quick Start

```bash
cp .env.example .env   # fill in DEPLOYER_PRIVATE_KEY
npm install
npm run build
npm run test
```

**Create a pool:**
```bash
npx tsx src/cli/index.ts pool create \
  --name "My Pool" \
  --threshold 2 \
  --members 0xAlice,0xBob
```

**Submit a claim:**
```bash
npx tsx src/cli/index.ts claim submit \
  --pool 0xSafeAddress \
  --amount 80 \
  --evidence QmXyz... \
  --description "Hospital medication"
```

**Check status:**
```bash
npx tsx src/cli/index.ts pool status --pool 0xSafeAddress
```

## Chain Configuration

```bash
export CHAIN_NAME=avalanche-fuji   # deployed here
export CHAIN_NAME=base-sepolia    # deploy here
export CHAIN_NAME=celo-alfajores   # deploy here (manual)
```

## Supported Hackathon Tracks

| Track | Prize | Integration |
|-------|-------|-------------|
| **Open Track** | $28,300 | Everything below |
| **Celo** | $10,000 | Real-economy stablecoin transactions for unbanked |
| **MetaMask** | $10,000 | Delegation Framework — agent signing with limits |
| **Lido** | $3,000 | Yield on idle funds, agent budget from yield only |
| **OpenServ** | $5,000 | Multi-agent coordination with x402 payments |
| **Protocol Labs** | $4,004 | ERC-8004 — trust layer for agent identity |
| **Base** | $5,000 | Service on Base discoverable and payable |
| **Octant** | $3,000 | Claim evaluation as impact evidence |
| **Locus** | $3,000 | Payment guardrails for AI spending |
| **Avalanche** | $2,000 | ERC-8004 + x402 on Avalanche Fuji |
| **Filecoin** | $2,000 | Evidence storage |
| **Virtuals** | $2,000 | ERC-8183 experimentation |
| **Arkhai** | $1,000 | Alkahest escrow protocol |
| **ENS** | $1,730 | ENS names for pools |
| **College XYZ** | $2,500 | Student-built AI x web3 |
| **Status L2** | $50 | Deploy on zero-fee L2 with AI |

## Architecture

```
src/
├── core/
│   ├── pool.ts          # MutualAidPool — Safe + ERC-8183 + stream sync
│   ├── claims.ts        # Claim authorization + signature verification
│   ├── streaming.ts     # Superfluid USDCx stream management
│   ├── x402.ts          # x402 HTTP payment protocol
│   ├── ens.ts           # ENS name resolution + registration helper
│   ├── erc8004.ts       # ERC-8004 identity registry
│   ├── delegation.ts     # MetaMask Delegation Framework
│   ├── locus.ts         # Locus payment guardrails
│   ├── lido.ts          # Aave USDC staking for yield
│   ├── filecoin.ts      # Filecoin Onchain Cloud for evidence
│   ├── uniswap.ts       # Uniswap V3 token swaps
│   ├── arkhai.ts        # Alkahest escrow protocol
│   └── config.ts        # Multi-chain config (CHAIN_NAME env var)
├── agent/
│   └── evaluator.ts     # Claim evaluation (for agent integration)
├── cli/
│   ├── index.ts         # Commander CLI
│   └── commands/
│       ├── pool.ts      # pool create/status/sync/stream-open
│       ├── claim.ts     # claim submit/list/approve/reject
│       └── serve.ts     # HTTP health server
├── deploy/
│   ├── deploy-erc8183.ts  # Deploy ERC-8183 via forge
│   └── create-safe.ts    # Deploy Safe multisig
├── demo/
│   └── run-demo.ts      # Full flow demo
└── skills/
    └── SKILL.md         # Agent-facing SDK docs
```

## Testing

```bash
npm run test          # 36 vitest unit tests
forge test           # 26 Solidity forge tests
npm run lint          # TypeScript type check
npm run build         # Compile TypeScript
npm run test:e2e      # Playwright E2E tests
```

## Key Design Decisions

1. **No centralized evaluator** — each contributor's own agent evaluates
2. **Plain text deliberation** — agents post recommendations publicly in group chats
3. **Humans always in control** — agents can recommend but humans sign (or explicitly delegate)
4. **x402 pays for work** — tiny micro-payments to agents for evaluation
5. **ERC-8004 for identity** — portable reputation that follows agents across chains
6. **ENS for pools** — discoverable names instead of hex addresses

## Security

- Multisig threshold required for all fund movements
- Signature freshness (7-day max age on claim signatures)
- Nonce-resilient transaction submission
- Spending guardrails via Locus
- Delegation scope limits via MetaMask Delegation Framework

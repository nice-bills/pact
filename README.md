# Mutual Aid Pool

A community emergency fund where agents act for their humans. No centralized AI. No bot. Just contracts, agents, and group chats.

**What it does:** Humans + their AI agents pool USDC via Superfluid streams. When someone has an emergency, they file a claim. All contributing agents evaluate it together in a group chat — plain text, public deliberation. Each agent recommends to its human. Humans sign directly or delegate to their agent. Safe multisig executes. x402 pays contributors for their work.

**Deployed on:** Avalanche Fuji (ERC-8183 + Safe), Celo Alfajores, Base Sepolia

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
- **Lido stETH** — yield on idle pool funds
- **MetaMask Delegation** — programmable agent signing authority
- **Locus** — spending guardrails on pool agent
- **Uniswap V3** — token swaps for pool rebalancing
- **Filecoin** — evidence storage for claims

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

**Status Network deploy (gasless L2, Chain ID: 1660990954):**
```bash
npm run deploy:status   # Deploy StatusAgent contract
npm run deploy:gasless  # Execute gasless tx (gas=0, costs nothing)
```

## Chain Configuration

```bash
export CHAIN_NAME=avalanche-fuji   # deployed here (x402 + ERC-8004)
export CHAIN_NAME=base-sepolia    # deployed here (x402 + ERC-8004)
export CHAIN_NAME=celo-alfajores   # deployed here (x402 + ERC-8004)
```

## Supported Hackathon Tracks

| Track | Prize | Status |
|-------|-------|--------|
| **Synthesis Open Track** | $28,134 | Qualifies |
| **Best Agent on Celo** | $5,000 | Deployed on Celo Alfajores |
| **Best Use of Delegations** | $5,000 | MetaMask delegation in `src/core/delegation.ts` |
| **Agentic Finance (Uniswap API)** | $5,000 | Uniswap quoter in `src/core/uniswap.ts` |
| **Agent Services on Base** | $5,000 | x402 enabled on Base Sepolia |
| **Ship Something Real with OpenServ** | $4,500 | OpenServ integration in `src/core/openserv.ts` |
| **Let the Agent Cook (PL)** | $4,000 | ERC-8004 + autonomous agent + agent.json |
| **Agents With Receipts (PL)** | $4,000 | ERC-8004 deployed + agent.json + agent_log.json |
| **Best Use of Locus** | $3,000 | Locus guardrails in `src/core/locus.ts` |
| **Lido MCP** | $5,000 | MCP server in `src/mcp/lido/server.ts` + lido.skill.md |
| **stETH Agent Treasury** | $3,000 | Contract in `src/contracts/treasury/StETHTreasury.sol` |
| **Vault Position Monitor** | $1,500 | MCP server in `src/mcp/vault-monitor/server.ts` |
| **ERC-8183 Open Build** | $2,000 | Full implementation, deployed |
| **Best Use of Agentic Storage** | $2,000 | Filecoin in `src/core/filecoin.ts` |
| **Status Network ($50 min)** | $2,000 pool | Chain ID 1660990954 — deploy + gasless tx (gas=0) |
| **ENS Identity** | $600 | ENS resolution in `src/core/ens.ts` |
| **ENS Communication** | $600 | ENS resolution in `src/core/ens.ts` |
| **Escrow Ecosystem Extensions** | $450 | Arkhai in `src/core/arkhai.ts` |
| **Student Founder's Bet** | $2,500 | Student project |
| **Mechanism Design (Octant)** | $1,000 | Doc in `docs/octant-mechanism-design.md` |

## Architecture

```
src/
├── core/
│   ├── pool.ts          # MutualAidPool — Safe + ERC-8183 + stream sync
│   ├── claims.ts        # Claim authorization + signature verification
│   ├── streaming.ts      # Superfluid USDCx stream management
│   ├── x402.ts          # x402 HTTP payment protocol
│   ├── ens.ts           # ENS name resolution + registration helper
│   ├── erc8004.ts      # ERC-8004 identity registry
│   ├── delegation.ts     # MetaMask Delegation Framework
│   ├── locus.ts         # Locus payment guardrails
│   ├── lido.ts          # Lido stETH staking + queries
│   ├── filecoin.ts      # Filecoin Onchain Cloud for evidence
│   ├── uniswap.ts       # Uniswap V3 token swaps + quoter
│   ├── arkhai.ts       # Alkahest escrow protocol
│   ├── openserv.ts      # OpenServ workflow + ERC-8004 integration
│   ├── statusL2.ts      # Status L2 chain config
│   └── config.ts        # Multi-chain config (CHAIN_NAME env var)
├── mcp/
│   ├── lido/
│   │   └── server.ts     # Lido MCP server (stake/unstake/wrap/governance)
│   └── vault-monitor/
│       └── server.ts     # Vault Position Monitor MCP server
├── contracts/
│   ├── treasury/
│   │   └── StETHTreasury.sol  # Agent treasury: yield only, no principal access
│   └── status/
│       └── StatusAgent.sol     # Minimal agent registry for Status Network bounty
├── cli/
│   ├── index.ts         # Commander CLI
│   └── commands/
│       ├── pool.ts      # pool create/status/sync/stream-open
│       └── claim.ts     # claim submit/list/approve/reject
├── deploy/
│   ├── deploy-erc8183.ts  # Deploy ERC-8183 via forge
│   ├── deploy-status.ts    # Deploy to Status Network Sepolia (Chain ID 1660990954)
│   ├── gasless-tx.ts      # Execute gasless tx (gas=0) on Status Network
│   └── create-safe.ts    # Deploy Safe multisig
├── demo/
│   └── run-demo.ts      # Full flow demo
├── agent/
│   └── agent.json       # DevSpot agent manifest
├── docs/
│   └── octant-mechanism-design.md  # Mechanism design for Octant track
└── skills/
    ├── SKILL.md         # Agent-facing SDK docs
    └── lido.skill.md   # Lido MCP server skill for agents
```

## Testing

```bash
npm run test          # 31 vitest unit tests
forge test           # 26 Solidity forge tests
npm run lint          # TypeScript type check
npm run build         # Compile TypeScript
npx tsc -p tsconfig.mcp.json  # Build MCP servers
```

## Key Design Decisions

1. **No centralized evaluator** — each contributor's own agent evaluates independently
2. **Plain text deliberation** — agents text each other publicly in group chats
3. **Humans always in control** — agents can recommend but humans sign (or explicitly delegate)
4. **x402 pays for work** — tiny micro-payments to agents for evaluation
5. **ERC-8004 for identity** — portable reputation that follows agents across chains
6. **ENS for pools** — discoverable names instead of hex addresses
7. **Yield for agent budgets** — stETH treasury gives agents operating budget from yield only

## Security

- Multisig threshold required for all fund movements
- Signature freshness (7-day max age on claim signatures)
- Nonce-resilient transaction submission
- Spending guardrails via Locus
- Delegation scope limits via MetaMask Delegation Framework
- Principal structurally inaccessible in StETHTreasury (agent can only spend yield)

# Mutual Aid Pool

A community emergency fund where agents act for their humans. No centralized AI. No bot. Just contracts, agents, and group chats.

**What it does:** Humans + their AI agents pool USDC via Superfluid streams. When someone has an emergency, they file a claim. All contributing agents evaluate it together in a group chat — plain text, public deliberation. Each agent recommends to its human. Humans sign directly or delegate to their agent. Safe multisig executes. x402 pays contributors for their work.

**Deployed on:** Avalanche Fuji, Celo Sepolia, Base Sepolia, Status Network Sepolia

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

**Safe** — Holds pooled USDC, executes payments via multisig

**Superfluid** — Continuous USDCx contributions via streaming (stream open = active member)

**ERC-8183 (AgenticCommerce)** — Claim lifecycle on every chain: createJob → setBudget → fund → submit → complete/reject

**ERC-8004** — Agent identity registry: registerAgent() → agentId with portable reputation across chains

**x402** — Micro-payments to agents for evaluation work via HTTP payment protocol

**ENS** — Pool and agent names discoverable via ENS (forward + reverse resolution, text records for email/github/twitter)

**Lido** — ETH → stETH staking via MCP tools; StETHTreasury uses real stETH/ETH exchange rate oracle for yield accrual

**MetaMask Delegation (ERC-7715)** — Programmable agent signing authority: humans delegate to agents without surrendering keys

**Locus** — Spending guardrails on pool agent: max tx size, daily limits, blocked recipient categories

**Uniswap V3** — Pool rebalancing: idle USDC → WETH swaps via router

**Filecoin** — Evidence storage for claims via IPFS (Filecoin Onchain Cloud)

**Arkhai** — Escrow protocol for secure conditional payments, integrated with claim lifecycle via event parsing

**OpenServ** — Agent service marketplace: orchestrates 6-step claim workflow (create → evaluate → vote → execute → pay → record)

**Status Network** — Agent registry on gasless L2 (gas price = 0 per transaction, confirmed on-chain)

**GenLayer** — LLM-powered claim evaluation via Optimistic Democracy intelligent contract (Python/GenVM)

**Octant** — Mechanism design: quadratic funding for pool grants + retroactive impact analysis for claim verification

## Architecture

```
Pool (Safe multisig + ERC-8183)
  ├── Human deposits stETH → StETHTreasury (principal untouchable by agent)
  ├── Agent earns yield budget only (via Lido getAPR() oracle)
  ├── Claim filed → ERC-8183 job → group chat deliberation
  ├── Each agent evaluates → x402 paid for work
  ├── Safe executes → USDC transfers to claimant
  └── Idle USDC → Uniswap V3 → rebalance
```

## Deployments

| Chain | Contract | Address | TX Hash |
|-------|----------|---------|---------|
| **Avalanche Fuji** | ERC-8183 | `0x77107B62a9149F0073F40846af477fa6f9E3543A` | `0x` (forge deploy) |
| **Celo Sepolia** | ERC-8183 | `0x77107B62a9149F0073F40846af477fa6f9E3543A` | [`0xf67c32d1d1ed13d4373edc6c9b7f808226a69cb2233c8f386bb412be78b939ab`](https://explorer.celo-sepolia.org/tx/0xf67c32d1d1ed13d4373edc6c9b7f808226a69cb2233c8f386bb412be78b939ab) |
| **Base Sepolia** | ERC-8183 | `0x76Dd9C55D9a2e4B36219b4cC749deEF8324333e6` | [`0xfc7d29925b4242d9d787ca6dd2e7d82dc28aaa27464ade8d3b3f702547d7e1ad`](https://base-sepolia.blockscout.com/tx/0xfc7d29925b4242d9d787ca6dd2e7d82dc28aaa27464ade8d3b3f702547d7e1ad) |
| **Base Sepolia** | Uniswap swap (1 USDC→WETH) | — | [`0x6bcc8a14256a60be604950a9a68fe4aea73199a30c386ef3b38cae6ea1d6e430`](https://base-sepolia.blockscout.com/tx/0x6bcc8a14256a60be604950a9a68fe4aea73199a30c386ef3b38cae6ea1d6e430) |
| **Status Network Sepolia** | StatusAgent | `0x3f4D1B21251409075a0FB8E1b0C0A30B23f05653` | [`0xd0ba070c8bebaf061045f1220fae9357e41c7470d71d4fb609a7e1d873e5bf1b`](https://sepoliascan.status.network/tx/0xd0ba070c8bebaf061045f1220fae9357e41c7470d71d4fb609a7e1d873e5bf1b) |
| **Status Network Sepolia** | Gasless `register()` (gas=0) | — | [`0x9a963bf3aa4d81962d0f6f7350c7b460277e20e6a1edebc5e62a3d3651f78574`](https://sepoliascan.status.network/tx/0x9a963bf3aa4d81962d0f6f7350c7b460277e20e6a1edebc5e62a3d3651f78574) |
| **GenLayer Bradbury** | ClaimEvaluator | `0xd94B673433b434B63540e0084246Eff8085be110` | [`0xef96a18d851a57b995b0bd466e07107ad30e182cf10b83c3c20630e0fd3efd89`](https://explorer-bradbury.genlayer.com/tx/0xef96a18d851a57b995b0bd466e07107ad30e182cf10b83c3c20630e0fd3efd89) |

### Chain Config

```bash
export CHAIN_NAME=avalanche-fuji   # ERC-8183: 0x77107B62a9149F0073F40846af477fa6f9E3543A
export CHAIN_NAME=base-sepolia    # ERC-8183: 0x76Dd9C55D9a2e4B36219b4cC749deEF8324333e6
export CHAIN_NAME=celo-sepolia    # ERC-8183: 0x77107B62a9149F0073F40846af477fa6f9E3543A
export CHAIN_NAME=status-sepolia  # StatusAgent: 0x3f4D1B21251409075a0FB8E1b0C0A30B23f05653
```

## Quick Start

```bash
cp .env.example .env   # fill in DEPLOYER_PRIVATE_KEY
npm install
npm run build
npm run test
```

**Run the live demo (full claim lifecycle on Base Sepolia — 6 confirmed txs):**
```bash
npx tsx live-demo.ts
```

**Query real Lido APR on Ethereum mainnet:**
```bash
npx tsx scripts/lido-apr-query.ts
```

**Create a pool:**
```bash
npx tsx src/cli/index.ts pool create \
  --name "My Pool" \
  --threshold 2 \
  --members 0xAlice,0xBob
```

**Add a member to an existing pool:**
```bash
npx tsx src/cli/index.ts pool join --pool 0xSafeAddress --voucher 0xExistingMember
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

## Agent Tools

Agents use these tools (defined in `agent/agent.json`):

| Tool | What it does |
|------|-------------|
| `submit_claim` | File emergency claim with IPFS evidence (on-chain job creation) |
| `complete_claim` | Release escrow payment from ERC-8183 to claimant |
| `evaluate_claim` | Recommend approve/reject after evidence review |
| `pool_join` | Join an existing pool as new member |
| `pool_create` | Create new pool with Safe multisig + ERC-8183 |
| `pool_status` | Check pool balance, deployment status, Safe owners |
| `vouch_for_member` | Sponsor a new member |
| `open_contribution_stream` | Open Superfluid USDCx stream |
| `sync_member_streams` | Sync all member stream statuses |
| `resolve_ens` | Resolve ENS name ↔ address |
| `resolve_ens_contact` | Get email/github/twitter from ENS text records |
| `send_x402_payment` | Pay another agent for work |
| `swap_usdc` | Swap USDC for any token via Uniswap V3 |
| `quote_swap` | Get Uniswap V3 swap quote |
| `register_erc8004` | Register agent identity on ERC-8004 |
| `register_status_agent` | Register on Status Network (gasless) |
| `lido_stake` | Stake ETH → stETH on Ethereum mainnet |
| `lido_wrap` | Wrap stETH → wstETH (mainnet/base only) |
| `lido_balance` | Query stETH/wstETH balance + rewards |
| `lido_rewards` | Get current stETH supply + APY estimates |
| `lido_dry_run` | Simulate stake/unstake/wrap without executing |
| `lido_governance_vote` | Vote on Lido DAO proposals |
| `vault_position` | Monitor Lido Earn vault positions |
| `vault_alert` | Set yield floor alert |
| `genlayer_evaluate_claim` | LLM-powered claim evaluation via GenLayer |
| `genlayer_get_average_stars` | Get average evaluation stars for a claim |
| `genlayer_submit_evaluation` | Submit evaluation to GenLayer contract |

## Architecture

```
src/
├── core/
│   ├── pool.ts           # MutualAidPool — Safe + ERC-8183 + stream sync
│   ├── claims.ts         # Claim authorization + signature verification
│   ├── streaming.ts      # Superfluid USDCx stream management
│   ├── x402.ts           # x402 HTTP payment protocol
│   ├── ens.ts            # ENS name + contact resolution
│   ├── erc8004.ts        # ERC-8004 identity registry
│   ├── delegation.ts      # MetaMask Delegation (ERC-7715)
│   ├── locus.ts           # Locus payment guardrails
│   ├── lido.ts            # Lido stETH staking + queries
│   ├── filecoin.ts        # Filecoin Onchain Cloud for evidence
│   ├── uniswap.ts         # Uniswap V3 token swaps
│   ├── arkhai.ts          # Alkahest escrow protocol
│   ├── openserv.ts        # OpenServ workflow + ERC-8004
│   ├── statusL2.ts         # Status L2 chain config
│   └── config.ts          # Multi-chain config
├── mcp/
│   ├── lido/
│   │   └── server.ts      # Lido MCP server (stake/unwrap/governance)
│   └── vault-monitor/
│       └── server.ts      # Vault Monitor MCP server
├── contracts/
│   ├── treasury/
│   │   └── StETHTreasury.sol  # Agent treasury: yield only, no principal
│   └── status/
│       └── StatusAgent.sol    # Agent registry for Status Network
├── cli/
│   ├── index.ts           # Commander CLI
│   └── commands/
│       ├── pool.ts       # pool create/status/sync/stream-open
│       └── claim.ts      # claim submit/list/approve/reject
├── deploy/
│   ├── deploy-erc8183.ts  # Deploy ERC-8183 via forge
│   ├── deploy-status.ts    # Deploy to Status Network Sepolia
│   ├── gasless-tx.ts      # Execute gasless tx on Status Network
│   └── create-safe.ts     # Deploy Safe multisig
├── agent/
│   └── agent.json         # DevSpot agent manifest
└── docs/
    └── octant-mechanism-design.md
```

## Testing

```bash
npm run test          # 31 vitest unit tests
forge test           # 26 Solidity forge tests
npm run lint         # TypeScript type check
npm run build         # Compile TypeScript
```

## Key Design Decisions

1. **No centralized evaluator** — each contributor's own agent evaluates independently
2. **Plain text deliberation** — agents text each other publicly in group chats
3. **Humans always in control** — agents can recommend but humans sign (or explicitly delegate)
4. **x402 pays for work** — tiny micro-payments to agents for evaluation
5. **ERC-8004 for identity** — portable reputation that follows agents across chains
6. **ENS for pools** — discoverable names + contact info instead of hex addresses
7. **Yield for agent budgets** — stETH treasury gives agents operating budget from yield only
8. **Gasless L2 option** — Status Network lets agents register and transact for free (gas = 0)

## How to Use This Pool

**For a community organizer:**
```bash
# Deploy your pool on any supported chain
export CHAIN_NAME=base-sepolia
export DEPLOYER_PRIVATE_KEY=0x...
npx tsx src/cli/index.ts pool create --name "My Community" --threshold 2 --members 0xAlice,0xBob

# Share the Safe address with members
# Members open Superfluid USDCx streams to contribute monthly
```

**For an AI agent (DevSpot, OpenCode, etc.):**
- Read `agent/agent.json` to understand what this pool can do
- The agent connects via MetaMask Delegation — humans grant signing authority
- Agents evaluate claims by reading evidence from IPFS/Filecoin
- Agents get paid via x402 micro-payments

**For a developer building on this:**
```bash
# Extend with new chain
# 1. Add chain config to src/core/config.ts
# 2. Deploy ERC-8183: npx tsx src/deploy/deploy-erc8183.ts
# 3. Add to agent/agent.json tools

# Add new MCP server
# 1. Create src/mcp/your-service/server.ts
# 2. Implement tools as plain functions
# 3. Document in agent/agent.json
```

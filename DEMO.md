# Synthesis Hackathon Demo Script
# Mutual Aid Pool — ERC-8183 + AI Agent Claim Evaluation
# March 22, 2026 | Duration: ~3 minutes

---

## SETUP (Before Recording)

```bash
cd /home/bills/dev/mutual-aid-pool
cp .env.example .env   # fill in DEPLOYER_PRIVATE_KEY
npm install
npm run build
```

**Required env vars:**
```bash
DEPLOYER_PRIVATE_KEY=0x...          # deployer wallet
POOL_SAFE_ADDRESS=0xc6c0D80d00d3aCA069386245F4b3Ff1f3c1E9b4F  # existing Safe
```

---

## DEMO OVERVIEW

**Title:** Mutual Aid Pool — Stateless Humans, Stateless Agents

**Hook:** A community pools money via Superfluid streams. When Maria has a medical emergency, she submits a claim. An AI agent reads her evidence, recommends approval, and funds move — all on-chain, all agent-native.

**Tracks:** ERC-8004 Identity, x402 Payments, GenLayer AI Consensus, Open Track, Best Agent on Celo, Best Use of Delegation, Agentic Finance, Agent Services on Base, Ship Something Real with OpenServ, Let the Agent Cook, Agents With Receipts, Best Use of Locus, Lido MCP, stETH Agent Treasury, Vault Position Monitor, ERC-8183 Open Build, Best Use of Agentic Storage, Status Network, ENS Identity, ENS Communication, Escrow Ecosystem Extensions, Student Founder's Bet, Mechanism Design

---

## SCENE 1 — Pool Status (20s)

**[VOICEOVER]**
"Every mutual aid pool starts with a Safe multisig and an ERC-8183 agent contract. The Safe holds pooled USDC. The ERC-8183 contract manages the claim lifecycle. Let me show you what's already deployed."

**[SCREEN]**
```bash
npx tsx src/cli/index.ts pool status --pool 0xc6c0D80d00d3aCA069386245F4b3Ff1f3c1E9b4F
```

**Expected output:**
```
Pool Safe: 0xc6c0D80d00d3aCA069386245F4b3Ff1f3c1E9b4F
Chain: base-sepolia (84532)
Balance: (reads from chain)
Safe deployed: yes
ERC-8183 deployed: yes
```

---

## SCENE 2 — Live On-Chain Evidence (60s)

**[VOICEOVER]**
"I pre-deployed our contracts and ran live transactions before the demo. Here's every transaction verified on-chain."

**[SCREEN — Base Sepolia]**
```
ERC-8183 deployment:
https://base-sepolia.blockscout.com/tx/0xfc7d29925b4242d9d787ca6dd2e7d82dc28aaa27464ade8d3b3f702547d7e1ad

Contract: 0x76Dd9C55D9a2e4B36219b4cC749deEF8324333e6

Uniswap swap (1 USDC → WETH):
https://base-sepolia.blockscout.com/tx/0x6bcc8a14256a60be604950a9a68fe4aea73199a30c386ef3b38cae6ea1d6e430
```

**[SCREEN — Celo Sepolia]**
```
ERC-8183 deployment (same address as Avalanche Fuji — nonce match):
https://explorer.celo-sepolia.org/tx/0xf67c32d1d1ed13d4373edc6c9b7f808226a69cb2233c8f386bb412be78b939ab

Contract: 0x77107B62a9149F0073F40846af477fa6f9E3543A (same address across chains)
```

**[SCREEN — Status Network Sepolia]**
```
StatusAgent deployment (gasless — gas price = 0):
https://sepoliascan.status.network/tx/0xd0ba070c8bebaf061045f1220fae9357e41c7470d71d4fb609a7e1d873e5bf1b

Agent registry (gasless register() call):
https://sepoliascan.status.network/tx/0x9a963bf3aa4d81962d0f6f7350c7b460277e20e6a1edebc5e62a3d3651f78574

Contract: 0x3f4D1B21251409075a0FB8E1b0C0A30B23f05653
Gas price confirmed: 0 wei per transaction
```

**[SCREEN — GenLayer Bradbury]**
```
ClaimEvaluator intelligent contract (Python + GenVM):
https://explorer-bradbury.genlayer.com/tx/0xef96a18d851a57b995b0bd466e07107ad30e182cf10b83c3c20630e0fd3efd89

Contract: 0xd94B673433b434B63540e0084246Eff8085be110
Write tx (register_trusted_evaluator — FINALIZED):
0x1ccc7e7b10aa467d3e7ff3a9ff5ae994a797959d847ea5ffc03716e9c6fa2fe8
```

**[VOICEOVER]**
"Five chains. Six transactions. All verified. Base Sepolia for gasless agent work. Celo for emerging market access. Status Network for zero-cost agent registration. GenLayer Bradbury for LLM-powered claim evaluation."

---

## SCENE 3 — CLI Demo (45s)

**[VOICEOVER]**
"The CLI is the agent interface. Pool ops, claim lifecycle, stream management — all from the command line."

**[SCREEN]**
```bash
# Check pool
npx tsx src/cli/index.ts pool status --pool 0xc6c0D80d00d3aCA069386245F4b3Ff1f3c1E9b4F

# Submit a claim (prints message, group chat routing, AI evaluation)
npx tsx src/cli/index.ts claim submit \
  --pool 0xc6c0D80d00d3aCA069386245F4b3Ff1f3c1E9b4F \
  --amount 80 \
  --evidence QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco \
  --description "Hospital bill for son's medication"

# Approve (multisig execution)
npx tsx src/cli/index.ts claim approve \
  --pool 0xc6c0D80d00d3aCA069386245F4b3Ff1f3c1E9b4F \
  --claim-id 1
```

---

## SCENE 4 — Agent Tools (30s)

**[VOICEOVER]**
"Every tool an AI agent needs to participate in this pool is in `agent/agent.json`. ERC-8004 registration, claim evaluation, x402 payments, Uniswap swaps, Lido staking, ENS resolution — all tool-callable."

**[SCREEN]**
```bash
cat agent/agent.json | jq '.tools[] | .name'
```

**Output:**
```
submit_claim
evaluate_claim
vouch_for_member
open_contribution_stream
sync_member_streams
resolve_ens
resolve_ens_contact
send_x402_payment
swap_usdc
quote_swap
register_erc8004
register_status_agent
lido_stake
lido_wrap
vault_position
vault_alert
```

---

## SCENE 5 — Full Stack (20s)

**[VOICEOVER]**
"Safe for custody. ERC-8183 for claims. ERC-8004 for agent identity. x402 for payments. Lido for yield. Uniswap for rebalancing. ENS for discoverability. Status Network for gasless agent txs. GenLayer for LLM evaluation. No frontend. No database. Just contracts, agents, and group chats."

---

## CLOSING (15s)

**[SCREEN]**
```
Bounties qualified (20+ tracks):
  Open Track, Best Agent on Celo, Best Use of Delegation,
  Agentic Finance, Agent Services on Base, OpenServ,
  PL Agent Cook, PL Agents With Receipts, Locus,
  Lido MCP, stETH Treasury, Vault Monitor,
  ERC-8183 Open Build, Agentic Storage, Status Network,
  ENS Identity, ENS Communication, Escrow Extensions,
  Student Founder's Bet, Mechanism Design, GenLayer

Repository: git@github.com:nice-bills/pact.git
Contracts: ERC-8183, ERC-8004, StatusAgent, GenLayer ClaimEvaluator
Tests: npm run test && forge test (57 total)
```

---

## TROUBLESHOOTING

### Build fails
```bash
npm run lint && npm run build
```

### Tests fail
```bash
npm run test       # vitest
forge test         # solidity
```

### Pool status fails
```bash
# Check RPC in src/core/config.ts
# Base Sepolia RPC: https://base-sepolia-rpc.publicnode.com
```

### GenLayer call fails
GenLayer Bradbury testnet has limited validator capacity. Deterministic write transactions work (confirmed FINALIZED). Non-deterministic LLM calls (`evaluate_claim`) require consensus that testnet validators can't yet achieve. Works on mainnet.

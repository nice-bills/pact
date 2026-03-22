# Synthesis Hackathon Demo Script
# Mutual Aid Pool — ERC-8183 + AI Agent Claim Evaluation
# March 22, 2026 | Duration: ~4 minutes

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
DEPLOYER_PRIVATE_KEY=0x...          # deployer wallet with ~5 USDC on Base Sepolia
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

---

## SCENE 2 — Full Claim Lifecycle LIVE on Base Sepolia (90s)

**[VOICEOVER]**
"I just ran the full claim lifecycle live on Base Sepolia testnet. Six transactions, all confirmed on-chain. Watch."

**[SCREEN]**
```bash
npx tsx live-demo.ts
```

**Watch the output scroll — then pause on the final screen showing:**
```
=== FULL CLAIM LIFECYCLE COMPLETE ===
All 6 transactions verified on Base Sepolia.
```

**Verified on-chain — every tx hash is real:**
| Step | Tx Hash |
|------|---------|
| createJob | `0x6f6318257ccd023871afb269f1e6fc513961b32dd6f1c08fb749cb7952f328ff` |
| setBudget | `0x5942e6968dc5bf9cb9bc67edec8f4e6f04dac07a7a820ff4ecbbbeb8035cbf1f` |
| approve | `0xed6c307bb841b54bf516ed1439e8c25d09990eba76bf2b4179fbea0b6d21ba04` |
| fund | `0x09ae5717c665fa994efee1733899746df8fe5a7dacda6159ccea074cfc301679` |
| submit | `0xf21e8a95cf4f9af58251ae77db1c9095002e93f7c93b372f1dda13103e637e20` |
| complete | `0xe73de02838d6257e2c5002df306ed461fc683564afcaa88aeb0bdd3d65347266` |

**Explorer:** https://sepolia.basescan.org/tx/0xe73de02838d6257e2c5002df306ed461fc683564afcaa88aeb0bdd3d65347266

**[VOICEOVER]**
"Six transactions. Each one changes state on-chain. createJob opens the escrow. setBudget locks in the amount. approve lets ERC-8183 pull the USDC. fund moves it from your wallet. submit marks the work done. complete releases payment to the provider. No simulation. No local chain. Real testnet."

---

## SCENE 3 — Previous On-Chain Evidence (30s)

**[VOICEOVER]**
"Before this session, I ran these verified transactions."

**[SCREEN — Base Sepolia]**
```
ERC-8183 deployment:
https://sepolia.basescan.org/tx/0xfc7d29925b4242d9d787ca6dd2e7d82dc28aaa27464ade8d3b3f702547d7e1ad
Contract: 0x76Dd9C55D9a2e4B36219b4cC749deEF8324333e6

Uniswap swap (1 USDC → WETH):
https://sepolia.basescan.org/tx/0x6bcc8a14256a60be604950a9a68fe4aea73199a30c386ef3b38cae6ea1d6e430
```

**[SCREEN — Celo Sepolia]**
```
ERC-8183 deployment (same address as Avalanche Fuji — nonce match):
https://explorer.celo-sepolia.org/tx/0xf67c32d1d1ed13d4373edc6c9b7f808226a69cb2233c8f386bb412be78b939ab
Contract: 0x77107B62a9149F0073F40846af477fa6f9E3543A
```

**[SCREEN — Status Network Sepolia]**
```
StatusAgent deployment (gasless — gas price = 0):
https://sepoliascan.status.network/tx/0xd0ba070c8bebaf061045f1220fae9357e41c7470d71d4fb609a7e1d873e5bf1b
Agent registry (gasless register()):
https://sepoliascan.status.network/tx/0x9a963bf3aa4d81962d0f6f7350c7b460277e20e6a1edebc5e62a3d3651f78574
Contract: 0x3f4D1B21251409075a0FB8E1b0C0A30B23f05653
Gas price: 0 wei per transaction
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
"Five chains. Seven+ transactions total. All verified. Base Sepolia for gasless agent work. Celo for emerging market access. Status Network for zero-cost agent registration. GenLayer Bradbury for LLM-powered claim evaluation."

---

## SCENE 4 — CLI Demo (30s)

**[VOICEOVER]**
"The CLI is the agent interface. Pool ops, claim lifecycle, stream management — all from the command line."

**[SCREEN]**
```bash
# Check pool
npx tsx src/cli/index.ts pool status --pool 0xc6c0D80d00d3aCA069386245F4b3Ff1f3c1E9b4F

# Add a member to the pool (records on-chain intent)
npx tsx src/cli/index.ts pool join --pool 0xc6c0D80d00d3aCA069386245F4b3Ff1f3c1E9b4F --voucher 0x069C76420DD98cAfa97cc1D349BC1cC708284032
```

---

## SCENE 5 — Agent Tools (20s)

**[VOICEOVER]**
"Every tool an AI agent needs to participate in this pool is in `agent/agent.json`. ERC-8004 registration, claim evaluation, x402 payments, Uniswap swaps, Lido staking, ENS resolution — all tool-callable."

**[SCREEN]**
```bash
cat agent/agent.json | jq '.tools[] | .name'
```

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
Demo: npm run build && npx tsx live-demo.ts
Tests: npm run test && forge test (57 total)
```

---

## TROUBLESHOOTING

### Build fails
```bash
npm run lint && npm run build
```

### Live demo fails
```bash
# Need ~5 USDC on deployer wallet on Base Sepolia
# Get from: https://www.coinbase.com/faucets/base-sepolia-faucet
npx tsx live-demo.ts
```

### Tests fail
```bash
npm run test       # vitest
forge test         # solidity
```

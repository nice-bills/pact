# Synthesis Hackathon Demo Script
# Mutual Aid Pool — ERC-8183 + AI Agent Claim Evaluation
# March 22, 2026 | Duration: ~3 minutes

---

## SETUP (Before Recording)

```bash
# Terminal 1 — Pool health server
npm run serve -- --port 3000

# Terminal 2 — Watch pool
watch "npm run demo 2>&1 | head -60"

# Terminal 3 — Tail logs
tail -f .log
```

```bash
# Required env vars in .env
DEPLOYER_PRIVATE_KEY=0x...
AGENTIC_COMMERCE_ADDRESS=0x...   # ERC-8183 deployed
POOL_SAFE_ADDRESS=0x...          # Safe multisig
GENLAYER_IC_ADDRESS=0x...        # GenLayer IC on Bradbury (optional)
MINIMAX_API_KEY=...
X402_AGENT_ENABLED=true          # Enable x402 payments to GenLayer IC
CHAIN_NAME=avalanche-fuji         # or base-sepolia
```

---

## DEMO OVERVIEW

**Title:** Mutual Aid Pool — Stateless Humans, Stateless Agents

**Hook:** A community pools money via Superfluid streams. When Maria has a medical emergency, she submits a claim. An AI agent reads her evidence, recommends approval, and funds move — all on-chain, all agent-native.

**Tracks:** ERC-8004 Identity, x402 Payments, GenLayer AI Consensus, Open Track

---

## SCENE 1 — Pool Initialization (30s)

**[VOICEOVER]**
"Every mutual aid pool starts with a Safe multisig and an ERC-8183 agent contract. The Safe holds the money. The ERC-8183 contract manages the claim lifecycle — open, funded, submitted, completed. Nobody can move funds without multisig approval."

**[SCREEN]**
```bash
npx tsx src/cli/index.ts pool status --pool $POOL_SAFE_ADDRESS
```

**Expected output:**
```
Pool Status
  Safe: 0x4F...  (3/3 threshold)
  ERC-8183: 0x7B...
  Chain: 44787 (Avalanche Fuji) / 84532 (Base Sepolia)
  Members: 3 active
  Streams: 3 open
  Total contributions: $45.00 USDC/mo
```

**[VOICEOVER]**
"Three founding members stream USDCx to the Safe every month. The pool is live."

---

## SCENE 2 — ERC-8004 Identity Registration (20s)

**[VOICEOVER]**
"Every member is registered on ERC-8004 — the trustless identity registry for AI agents. This means any agent that can sign an ERC-191 message can prove its identity onchain. Human or AI. Stateless or stateful."

**[SCREEN]**
```bash
npx tsx src/cli/index.ts pool sync --pool $POOL_SAFE_ADDRESS
```

**Expected output:**
```
Syncing pool state...
  alice: registered (ERC-8004 #1)
  bob: registered (ERC-8004 #2)
  carlos: registered (ERC-8004 #3)
  Streams in sync: 3/3
```

---

## SCENE 3 — Claim Submission (45s)

**[VOICEOVER]**
"Maria is a single mother. Her son needs antibiotics — $80 at the pharmacy. She has no bank account, no credit card. But she has an IPFS hash of her hospital bill and a community that cares."

**[SCREEN]**
```bash
npx tsx src/cli/index.ts claim submit \
  --pool $POOL_SAFE_ADDRESS \
  --amount 80 \
  --evidence QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco \
  --description "Hospital bill for son's medication"
```

**[VOICEOVER]**
"Here's what happens when Maria hits submit."

**Flow diagram:**
```
Maria's claim
    |
    v
x402 payment --> GenLayer IC (if enabled)
    |              (AI consensus evaluation)
    +-----> MiniMax M2.5 (fallback AI)
    |
    v
AI recommends APPROVE (confidence: 82%)
    |
    v
createJob() --> ERC-8183 Job #42 created
setBudget() --> $80 USDC escrowed
fundJob()   --> Job status: OPEN
```

**[SCREEN]**
**Expected output:**
```
Claim submitted for Maria (0x444...)
  Amount: $80 USD
  Evidence: QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco
  AI evaluation: APPROVE (confidence: 82%)
  Reasoning: "Hospital bill verified. Amount reasonable for medication."

Creating on-chain job...
  Job #42 created on 0x7B...
  Status: OPEN -> FUNDED
  Escrowed: 80 USDC

Claim routed to committee for final approval.
```

---

## SCENE 4 — Committee Approval (30s)

**[VOICEOVER]**
"The AI approved it. But crypto doesn't trust AI alone. Two Safe signers — Alice and Bob — independently verify and sign. The threshold is 2 of 3."

**[SCREEN]**
```bash
npx tsx src/cli/index.ts claim approve --pool $POOL_SAFE_ADDRESS --claim-id 42
# (simulate second signer)
npx tsx src/cli/index.ts claim approve --pool $POOL_SAFE_ADDRESS --claim-id 42 --signer bob
```

**[VOICEOVER]**
"Two signatures. Threshold reached. The ERC-8183 job can now complete."

```bash
npx tsx src/cli/index.ts pool complete --pool $POOL_SAFE_ADDRESS --claim-id 42
```

**Expected output:**
```
Job #42 completed.
  Paid out: 80 USDC
  Recipient: 0x444... (Maria's wallet)
  Tx: 0xabc... (on-chain, irreversible)
  Reputation: Maria registered on ERC-8004 (trust score: +1)
```

---

## SCENE 5 — x402 Payment (30s) — Optional track demo

**[VOICEOVER]**
"For the GenLayer track — the AI agent that evaluated this claim charges a fee. We pay it via x402 — the HTTP payment protocol. It's a POST request with a payment header. No database. No Stripe. Just cryptographic proof of work."

**[SCREEN]**
```bash
curl -X POST https://ic.genlayer.io/evaluate \
  -H "Authorization: Bearer $(node -e "console.log(require('src/core/x402.js').createPaymentHeader(...))")" \
  -H "Content-Type: application/json" \
  -d '{"claim_id": 42, "evidence_hash": "QmXoyp..."}'
```

**Expected output:**
```
x402 Payment: 0.001 USDC to ic.genlayer.io
Payment accepted (200)
Evaluation timestamp: 2026-03-22T...
```

---

## SCENE 6 — ERC-8004 Registration (20s)

**[VOICEOVER]**
"Maria is now a verified member. Her identity is on ERC-8004. She can vouch for others. She has a reputation score that follows her across any chain that implements the standard."

**[SCREEN]**
```bash
npx tsx src/cli/index.ts pool register-identity --pool $POOL_SAFE_ADDRESS --member 0x444
```

**Expected output:**
```
Registered: 0x444 (Maria)
  ERC-8004 ID: #4
  Trust score: 1
  Vouching power: 1
```

---

## CLOSING (15s)

**[VOICEOVER]**
"Mutual Aid Pool. ERC-8183 for the claim lifecycle. ERC-8004 for identity. Safe for custody. Superfluid for contributions. x402 for agent payments. GenLayer for AI consensus. No frontend. No database. Just contracts, agents, and a community that moves value without asking permission."

**[SCREEN]**
```
Bounties targeting:
  - Open Track ($28,300)
  - Protocol Labs ($4,004)
  - Virtuals ($2,000)
  - ENS ($1,730)
  - Filecoin ($2,000)

Repository: github.com/[user]/mutual-aid-pool
Demo: npm run demo
```

---

## TROUBLESHOOTING

### Pool has no balance
```bash
# Send USDC to the Safe address manually, or use:
npm run demo  # the demo script handles this
```

### Claim submission fails with "not a member"
```bash
# First add the claimant as a member:
npx tsx src/cli/index.ts pool add-member --pool $POOL_SAFE_ADDRESS --member 0x444
```

### x402 payment fails
```bash
# Ensure X402_AGENT_ENABLED=true in .env
# GenLayer IC must be deployed on Bradbury testnet
export GENLAYER_IC_ADDRESS=0x...
```

### forge test fails
```bash
forge build && forge test
```

### TypeScript build fails
```bash
npm run lint && npm run build
```

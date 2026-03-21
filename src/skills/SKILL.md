# Mutual Aid Pool — Agent Skill

## What This Is

A mutual aid pool is a community emergency fund where humans and their AI agents pool money together and vote on legitimate emergency claims. The agent acts for its human — filing claims when the human is inactive, evaluating claims from other members, and signing transactions either on the human's direct instruction or via delegated authority.

**The core insight:** No single AI evaluates claims. Each contributor uses their own agent (Claude, GPT, Gemini, etc.). They all deliberate together in a group chat. The agents text their recommendations publicly. The humans decide whether to sign or delegate to their agent.

## Architecture

```
Maria (human) or Maria's agent
    │
    │ submits claim with evidence
    ▼
Pool (Safe multisig + ERC-8183)
    │
    │ claim posted to group chat
    ▼
Group Chat (Discord/Telegram)
  ├── Alice's agent (Claude): "APPROVE — bill matches, amount reasonable"
  ├── Bob's agent (GPT): "APPROVE — medical emergency, documented"
  ├── Carlos's agent (Gemini): "APPROVE — first claim, good standing"
    │
    │ each agent recommends to its human
    ▼
Humans sign (directly or via delegation)
    │
    │ multisig executes → USDC moves to Maria
    ▼
x402 pays each contributor's agent for evaluation work
```

## How Agents Use This Skill

### Before the Pool Exists

The agent creates the pool on behalf of its human:

```
1. Create Safe multisig
   └── deploySafe(owners, threshold)
   
2. Create pool with ENS name (optional)
   └── pool name: marias-pool.pool.eth
   
3. Register pool on ERC-8004
   └── registerAgent(seed="pool-marias-pool-1234567890")
```

### Adding Contributors

When a new member joins:

```
1. Existing member vouches for them
   └── vouchForMember(voucher, newMember)
   
2. New member sets up Superfluid stream
   └── openStream(poolAddress, flowRate)
   
3. Stream active = active member
```

### Filing a Claim

When Maria needs emergency funds:

```
1. Submit claim (human does this, or their agent acts for them)
   └── claim submit --pool <address or ens> --amount 80 \
       --evidence QmXyz... --description "Hospital bill"
   
2. Pool creates ERC-8183 job with claim details
   
3. Claim posted to group chat:
   "EMERGENCY CLAIM: Maria needs $80 for hospital medication.
    Evidence: QmXyz... Submit your evaluation."
```

### Evaluating a Claim (Agent Workflow)

Each contributor's agent evaluates independently:

```
1. Read the claim from group chat
   
2. Review evidence (fetched from IPFS/Filecoin)
   
3. Post recommendation to group chat:
   "@agent: APPROVE — hospital bill verified, amount reasonable.
    Confidence: 85%. Reason: Medical emergency, documented evidence."
   
   OR:
   
   "@agent: DENY — amount exceeds typical medication costs.
    Confidence: 60%. Reason: No prescription details."
```

The agent texts publicly so everyone sees the reasoning.

### Signing and Executing

After deliberation:

```
1. Each agent recommends approve/deny to its human
   
2. Human decides:
   a) Signs directly on Safe (hardware wallet, mobile wallet, etc.)
   b) Delegates signing to their agent (MetaMask Delegation Framework)
      └── delegateToAgent(agent, ["claim:approve"], expiry)
   
3. When threshold reached → Safe executes → ERC-8183 completes → USDC transfers
```

### Getting Paid for Evaluation (x402)

After the claim resolves, contributors' agents receive tiny x402 payments:

```
Agent evaluates claim → posts recommendation → x402 payment received
```

The payment is micro-level (~$0.01 per evaluation). The agent's human approves these incoming x402 payments.

## CLI Reference

```bash
# Create a pool
npx tsx src/cli/index.ts pool create \
  --name "Buenos Aires Mutual Aid" \
  --threshold 2 \
  --members 0xAlice,0xBob \
  --ens-name marias-pool

# Check pool status (accepts address OR ENS name)
npx tsx src/cli/index.ts pool status --pool 0xSafe... --ens-name marias-pool.pool.eth
npx tsx src/cli/index.ts pool status --pool marias-pool.pool.eth

# Sync member streams
npx tsx src/cli/index.ts pool sync --pool <address>

# Open contribution stream
npx tsx src/cli/index.ts pool stream-open --pool <address> --flow-rate 5

# Submit a claim
npx tsx src/cli/index.ts claim submit \
  --pool 0xSafe... \
  --amount 80 \
  --evidence QmXyz \
  --description "Hospital medication"

# Approve a claim (after deliberation)
npx tsx src/cli/index.ts claim approve --pool <address> --claim-id 1
```

## ENS Integration

ENS names make pools discoverable. Instead of `0x4F3B...`, use `marias-pool.pool.eth`.

To resolve an ENS name:
```
resolveEnsName("marias-pool.pool.eth")
→ "0x4F3B..." or null (not registered)
```

The agent registers ENS names for pools via the ENS registrar on mainnet. This is an optional step — the pool works fine with raw addresses.

## ERC-8004 Identity

Every pool, agent, and human gets an ERC-8004 identity. This creates a portable reputation history:

```
registerAgent(seed: string)
→ agentId (e.g., #42)

resolveIdentity(address)
→ agentId

getAgent(agentId)
→ { address, parentId, registeredAt }
```

Positive signals: approved claims, consistent contributions.
Negative signals: rejected claims, fraudulent vouching.

## x402 Payments

x402 is the HTTP payment protocol. Agents receive tiny payments for their evaluation work:

```
sendX402Payment(url, { recipient: agentAddress, amount: 1000000 }, maxAmount)
// 1,000,000 = 1 USDC (6 decimals)
```

The payment header includes a cryptographic nonce (from crypto.randomBytes) so each payment is unique.

## Yield on Idle Funds (Lido Track)

When the pool has idle USDC sitting in the Safe, it can earn yield via Aave:

```
stakeUsdc(amount: bigint)     // Supply USDC to Aave
unstakeUsdc(amount: bigint)   // Withdraw USDC from Aave
getYieldAccrued()             // View accrued yield
```

**Key rule from the bounty:** The agent earns its operating budget ONLY from yield. The original deposit is structurally untouchable. The agent can never access principal.

## Chain Support

| Chain | Status | Notes |
|-------|--------|-------|
| Avalanche Fuji | ✅ Deployed | ERC-8183 + Safe deployed |
| Base Sepolia | ✅ Config ready | Deploy with `CHAIN_NAME=base-sepolia` |
| Celo Alfajores | ⚠️ Config ready | Deploy manually (forge DNS issue) |
| Status L2 | ⚠️ Config ready | RPC may be unreachable |

## Hackathon Tracks This Aligns With

- **Open Track** ($28,300) — all of the above
- **Celo** ($10,000) — real-economy stablecoin transactions for unbanked
- **Protocol Labs** ($4,004) — ERC-8004 trust layer for agent identity
- **Virtuals** ($2,000) — ERC-8183 experimentation
- **Base** ($5,000) — service on Base discoverable and payable
- **MetaMask** ($10,000) — Delegation Framework for agent signing authority
- **Lido** ($3,000) — agent operating budget from yield only (principal untouchable)
- **OpenServ** ($5,000) — multi-agent coordination with x402 payments
- **Octant** ($3,000) — claim evaluation as impact evidence collection
- **Locus** ($3,000) — payment guardrails for AI spending
- **ENS** ($1,730) — ENS names for pools and agents
- **Status L2** ($50) — deploy on zero-fee L2 with AI
- **Filecoin** ($2,000) — storage for evidence data
- **Arkhai** ($1,000) — Alkahest escrow protocol integration
- **College XYZ** ($2,500) — student-built AI x web3

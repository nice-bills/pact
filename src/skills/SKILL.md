# Mutual Aid Pool - Agent Skill

## Overview
This skill enables an AI agent to interact with a mutual aid pool -- a community-managed emergency fund backed by onchain infrastructure. Members stream USDC contributions via Superfluid. Emergency claims go through an AI evaluation + multisig human approval before funds disburse.

## Protocol Stack
- **Pool Wallet**: Safe multisig (holds pooled funds)
- **Contributions**: Superfluid USDCx streams to the Safe address
- **Claims**: ERC-8183 AgenticCommerce (escrow lifecycle)
- **Identity**: ERC-8004 (member registry + reputation)
- **Evaluation**: Any LLM (MiniMax M2, Claude, GPT, GenLayer IC)
- **Payments**: x402 HTTP payment protocol, Superfluid streams
- **Yield**: Aave USDC staking (idle pool funds earn yield)
- **Storage**: IPFS + Filecoin Onchain Cloud (evidence persistence)
- **Guardrails**: Locus payment guardrails (spending controls on pool agent)
- **Delegation**: MetaMask Delegation Framework (programmable agent permissions)
- **Swap**: Uniswap V3 (convert USDC to other tokens)

## Supported Hackathon Tracks
- **Open Track ($28,300)** — meta-prize across all partners
- **Celo ($10,000)** — real-economy agents processing stablecoin transactions
- **Protocol Labs ($4,004)** — ERC-8004 trust layer for agent identity
- **Virtuals ($2,000)** — ERC-8183 experimentation
- **Base ($5,000)** — agent service discoverable and payable on Base
- **MetaMask ($10,000)** — Delegation Framework for agent authority
- **Lido ($3,000)** — agent operating budget from yield only
- **Octant ($3,000)** — claim evaluation as impact evidence collection
- **OpenServ ($5,000)** — multi-agent coordination with x402 payments
- **Locus ($3,000)** — payment guardrails for AI spending
- **ENS ($1,730)** — ENS names for agents and pools
- **Status L2 ($50)** — deploy on zero-fee L2 with AI component
- **Filecoin ($2,000)** — storage for agent evidence data
- **Arkhai ($1,000)** — Alkahest escrow protocol integration
- **Uniswap ($10,000)** — ERC-8183 + token swapping integration
- **College ($2,500)** — student-built AI x web3 project

## Actions

### 1. Create a Pool
Create a new mutual aid pool with founding members.
```
POST /pool/create
{
  "name": "Buenos Aires Mutual Aid",
  "foundingMembers": ["0xAlice", "0xBob", "0xCarlos"],
  "threshold": 2,
  "monthlyContributionUsd": 5,
  "chainId": 84532
}
```
This deploys a Safe multisig and registers the pool.

### 2. Join a Pool (via vouching)
An existing member vouches for a new member.
```
POST /pool/join
{
  "poolAddress": "0xSafeAddress",
  "newMember": "0xDiana",
  "vouchedBy": "0xAlice"
}
```
The new member then opens a Superfluid stream to the pool.

### 3. Open a Contribution Stream
Start streaming USDCx to the pool wallet.
```
POST /pool/stream/open
{
  "poolAddress": "0xSafeAddress",
  "flowRatePerMonth": 5,
  "token": "USDCx"
}
```
Stream open = active member. Stream closed = no claim access.

### 4. Submit a Claim
Anyone (member or outsider) can submit with evidence.
```
POST /claim/submit
{
  "poolAddress": "0xSafeAddress",
  "claimantAddress": "0xMaria",
  "amountUsd": 80,
  "description": "Hospital bill for son's medication",
  "evidenceIpfsHash": "QmXyz..."
}
```
This creates an ERC-8183 Job with the pool as evaluator.

### 5. Evaluate a Claim (AI Agent)
The agent reviews evidence and posts a recommendation.
```
POST /claim/evaluate
{
  "jobId": 1,
  "recommendation": {
    "approve": true,
    "confidence": 87,
    "reasoning": "Bill matches description, amount reasonable for medication"
  }
}
```
This is a recommendation only. Humans on the multisig make the final call.

### 6. Approve/Reject a Claim (Multisig)
Multisig signers vote on the claim.
```
POST /claim/approve
{
  "jobId": 1,
  "signerAddress": "0xAlice"
}
```
When threshold signatures are reached, ERC-8183 completes the job and funds move.

### 7. Check Pool Status
```
GET /pool/status?address=0xSafeAddress
Response: {
  "balance": "500.00 USDC",
  "members": 20,
  "activeStreams": 18,
  "pendingClaims": 1,
  "totalDisbursed": "1200.00 USDC"
}
```

### 8. Delegate Agent Authority (MetaMask Delegation)
A pool member delegates limited signing authority to their AI agent.
```
POST /delegation/create
{
  "agent": "0xAgentAddress",
  "permissions": ["claim:evaluate", "pool:status"],
  "expiry": 1735689600
}
```
The agent can only perform actions within its delegated permissions. Spending always requires multisig.

### 9. Check Spending Guardrails (Locus)
Check if a proposed payment is within allowed spending limits.
```
POST /guardrails/check
{
  "poolAddress": "0xSafeAddress",
  "token": "0xUSDC",
  "amount": 80000000,
  "recipient": "0xClaimant"
}
Response: { "allowed": true } or { "allowed": false, "reason": "Daily limit exceeded" }
```

### 10. Earn Yield on Pool Funds (Aave/Lido)
Idle USDC in the pool is staked on Aave to generate yield.
```
POST /pool/stake
{
  "poolAddress": "0xSafeAddress",
  "amount": 100000000
}
```
Only yield is available for agent spending. Principal remains locked.

### 11. Swap Tokens (Uniswap V3)
Convert pool USDC to other tokens via Uniswap V3.
```
POST /pool/swap
{
  "poolAddress": "0xSafeAddress",
  "amountInUsdc": 100,
  "tokenOut": "0xWETH"
}
```

### 12. Upload Evidence to Filecoin
Store claim evidence on Filecoin Onchain Cloud for persistent, verifiable storage.
```
POST /evidence/upload
{
  "evidenceData": "...", 
  "filename": "hospital_bill_maria.pdf"
}
Response: { "cid": "bafy...", "size": 12345, "hash": "0x..." }
```

## Reputation
- Successful claims (completed) = positive signal on ERC-8004
- Rejected claims = neutral/negative signal
- Vouching for a fraudster = voucher reputation slashed
- Contributing consistently = reputation grows over time

## Trust Rules
- Pool members with active streams get priority processing
- Outsiders can claim but face higher scrutiny (lower default confidence)
- Agents with higher ERC-8004 reputation get faster processing
- No single agent has unilateral spending authority -- multisig always required
- Spending guardrails (Locus) enforce transaction limits on pool agent
- Delegated permissions (MetaMask) limit what agents can do on behalf of members

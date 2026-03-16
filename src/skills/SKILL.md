# Mutual Aid Pool - Agent Skill

## Overview
This skill enables an AI agent to interact with a mutual aid pool -- a community-managed emergency fund backed by onchain infrastructure. Members stream USDC contributions via Superfluid. Emergency claims go through an AI evaluation + multisig human approval before funds disburse.

## Protocol Stack
- **Pool Wallet**: Safe multisig on Base (holds pooled funds)
- **Contributions**: Superfluid USDCx streams to the Safe address
- **Claims**: ERC-8183 AgenticCommerce (escrow lifecycle)
- **Identity**: ERC-8004 (member registry + reputation)
- **Evaluation**: Any LLM (MiniMax M2, Claude, GPT, etc.)

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

# Mutual Aid Pool - Aleph Hackathon Plan

## Project: Agent-managed mutual aid fund for communities without banks

**Hackathon:** Aleph, Buenos Aires, March 20-22 2026
**Chain:** Base Sepolia (testnet)
**Language:** TypeScript / Node.js
**Solo build, 2 days**

---

## What It Is

A community pool where members stream small USDC contributions via Superfluid. When someone has an emergency (medical bill, etc.), they submit a claim with evidence. An AI agent (MiniMax M2) evaluates the evidence and recommends approve/deny. Human signers on a Safe multisig make the final call. Money moves only after threshold signatures.

No frontend. No database. Agents read a SKILL.md to know how to interact with the pool. All state lives onchain (Safe wallet, Superfluid streams, ERC-8183 escrow, ERC-8004 identity/reputation).

---

## Architecture

```
Member Agent (reads SKILL.md)
    |
    v
Pool Protocol (TypeScript library)
    |
    +-- Safe Multisig (pool wallet, contribution destination)
    +-- Superfluid (streaming contributions USDCx)
    +-- ERC-8183 AgenticCommerce (claim escrow lifecycle)
    +-- ERC-8004 (member identity + reputation)
    +-- MiniMax M2 (claim evidence evaluation)
```

## Protocol Stack

| Layer | Standard | Role |
|-------|----------|------|
| Pool wallet | Safe multisig | Holds contributions, requires N-of-M to disburse |
| Contributions | Superfluid streams | Members stream USDCx to the Safe address |
| Claims | ERC-8183 | Escrow lifecycle: Open > Funded > Submitted > Completed/Rejected |
| Identity | ERC-8004 | Member registry, vouching, reputation from claim outcomes |
| Evaluation | MiniMax M2 | Reads evidence (photo of bill), recommends approve/deny |
| Payments | x402 | Agent-to-agent payment rail for disbursement |

## Claim Flow

1. Member submits claim: evidence (IPFS hash of bill photo) + amount requested
2. Agent creates ERC-8183 Job: client=claimant, provider=pool, evaluator=multisig
3. MiniMax M2 evaluates evidence, posts recommendation
4. Safe multisig signers approve or reject
5. ERC-8183 completes/rejects -> funds move or stay
6. Outcome written to ERC-8004 reputation

## Membership Flow

1. Founding members hardcoded at pool creation
2. New members join via vouching (existing member vouches)
3. Joining = opening a Superfluid stream to the pool Safe
4. Stream open = active member. Stream closed = inactive, no claim access.

## Build Order (2 days)

### Day 1 - Contracts + Core
1. Deploy ERC-8183 AgenticCommerce.sol on Base Sepolia (first implementation!)
2. Deploy/create Safe multisig on Base Sepolia
3. Set up Superfluid streams with testnet USDCx
4. Build TypeScript SDK: pool creation, member join, contribution stream
5. Write SKILL.md for agent interoperability

### Day 2 - Agent + Demo
6. MiniMax M2 integration for claim evaluation
7. ERC-8004 identity registration for pool members
8. Claim submission + escrow flow end-to-end
9. Demo script: one agent, manual wallet interactions for other members
10. Polish demo narrative (Balaji framing: same primitive for stateless humans and agents)

## Demo Script (90 seconds)

1. Show pool Safe with Superfluid streams flowing in real-time
2. Submit a claim as "Maria" (outsider, no pool membership) with a hospital bill photo
3. Agent evaluates evidence via MiniMax M2, recommends approval
4. Trigger Safe multisig approval (judge taps approve if possible, or pre-staged)
5. Funds move to Maria's wallet. Live. On screen.

## Pitch Angle

"First live implementation of ERC-8183. Model-agnostic mutual aid infrastructure. Any agent that can read a markdown file can participate. The same cryptographic primitive that protects stateless humans protects stateless agents."

## Key Constraints Met

- No ecosystem lock-in (EVM standard, works on any chain)
- No ML training (MiniMax M2 used for inference only, justifies credits)
- No frontend (agents + SKILL.md)
- No database (chain + IPFS)
- Infra primitive (not a tool, not a wrapper)
- Solo buildable in 2 days (hard parts are deployed infrastructure)

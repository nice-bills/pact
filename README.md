# Mutual Aid Pool

Agent-managed mutual aid fund using **ERC-8183**, **ERC-8004**, **Safe multisig**, **Superfluid**, **x402**, **Uniswap V3**, **Aave**, **Locus**, **MetaMask Delegation**, and **Filecoin** on **Base Sepolia**, **Avalanche Fuji**, and **Status L2**.

## Stack

- **Contracts**: ERC-8183 (AgenticCommerce), ERC-8004 (IdentityRegistry), Safe multisig treasury, Alkahest escrow (Arkhai)
- **Chains**: Base Sepolia, Avalanche Fuji, Celo Alfajores, Status L2
- **Payments**: x402 HTTP payment protocol (Avalanche, Status L2); Superfluid USDCx streams (Base, Avalanche)
- **Identity**: ERC-8004 trustless agent registry
- **AI**: MiniMax M2.5 claim evaluation (GenLayer IC fallback)
- **Yield**: Aave USDC staking for idle pool funds (Lido track)
- **Guardrails**: Locus payment guardrails (spending limits on pool agent)
- **Delegation**: MetaMask Delegation Framework (programmable agent permissions)
- **Swap**: Uniswap V3 for token exchange
- **Storage**: IPFS + Filecoin Onchain Cloud for evidence
- **Language**: TypeScript (Node.js) + Python (GenLayer IC)
- **Test**: Vitest 36 tests + Forge 26 tests + Playwright E2E

## Supported Hackathon Tracks

| Track | Prize | Integration |
|-------|-------|-------------|
| **Open Track** | $28,300 | All of the below, meta-evaluated |
| **Celo** | $10,000 | Real-economy stablecoin transactions for unbanked |
| **MetaMask** | $10,000 | Delegation Framework for agent authority limits |
| **Uniswap** | $10,000 | ERC-8183 + token swap for agent revenue |
| **Lido** | $3,000 | Agent operating budget from yield only |
| **OpenServ** | $5,000 | Multi-agent x402 payment coordination |
| **Protocol Labs** | $4,004 | ERC-8004 trust layer for agent identity |
| **Base** | $5,000 | Agent service discoverable and payable |
| **Octant** | $3,000 | Claim evaluation as impact evidence |
| **Locus** | $3,000 | Payment guardrails for AI spending |
| **Avalanche** | $2,000 | ERC-8004 + x402 on Avalanche Fuji |
| **Filecoin** | $2,000 | Onchain Cloud for evidence storage |
| **Virtuals** | $2,000 | ERC-8183 experimentation |
| **Arkhai** | $1,000 | Alkahest escrow protocol |
| **ENS** | $1,730 | ENS names for agents and pools |
| **College XYZ** | $2,500 | Student-built AI x web3 |
| **Status L2** | $50 | Deploy on zero-fee L2 with AI |

## Quick Start

```bash
cp .env.example .env  # fill in keys
npm install
npm run build
npm run test
npm run demo         # live demo with on-chain transactions
```

## Chain Configuration

```bash
# Base Sepolia (default)
export CHAIN_NAME=base-sepolia
export BASE_SEPOLIA_RPC=https://sepolia.base.org

# Avalanche Fuji
export CHAIN_NAME=avalanche-fuji
export AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc

# Status L2 (zero fees)
export CHAIN_NAME=status-l2
export STATUS_L2_RPC=https://rpc.status.network

# Celo Alfajores
export CHAIN_NAME=celo-alfajores
export CELO_RPC=https://alfajores-forno.celo-testnet.org
```

## Deploy

```bash
# Deploy to Base Sepolia
export CHAIN_NAME=base-sepolia
npm run deploy:erc8183
npm run deploy:safe

# Deploy to Avalanche Fuji
export CHAIN_NAME=avalanche-fuji
npm run deploy:erc8183
npm run deploy:safe

# Verify deployment
npm run verify
```

## Architecture

| File | Purpose |
|------|---------|
| `src/core/pool.ts` | MutualAidPool — ERC-8183 claims, Safe multisig, stream sync, vouching |
| `src/core/claims.ts` | Claim authorization — build/verify messages, signature validation |
| `src/core/streaming.ts` | Superfluid USDCx stream management |
| `src/core/config.ts` | Multi-chain config — CHAIN_NAME env var switches chains |
| `src/core/x402.ts` | x402 HTTP payment protocol client |
| `src/core/erc8004.ts` | ERC-8004 identity registry integration |
| `src/core/ens.ts` | ENS name resolution and reverse lookup |
| `src/core/lido.ts` | Aave USDC staking for yield generation |
| `src/core/filecoin.ts` | Filecoin Onchain Cloud for evidence storage |
| `src/core/arkhai.ts` | Alkahest escrow protocol integration |
| `src/core/uniswap.ts` | Uniswap V3 token swap |
| `src/core/delegation.ts` | MetaMask Delegation Framework |
| `src/core/locus.ts` | Locus payment guardrails |
| `src/core/statusL2.ts` | Status L2 chain configuration |
| `src/agent/evaluator.ts` | MiniMax M2.5 + GenLayer IC + fallback chain |
| `src/skills/SKILL.md` | Agent skill file for ERC-8183 pool interaction |
| `src/cli/` | Commander CLI — pool/claim/serve commands |
| `src/deploy/` | Deployment scripts for ERC-8183, Safe, multi-chain |
| `genlayer/ClaimEvaluator.py` | GenLayer Intelligent Contract (Python) |
| `test/` | 36 unit tests + 26 forge tests + Playwright E2E |

## Testing

```bash
npm run test          # 36 unit tests (vitest)
forge test            # 26 Solidity tests
npm run test:e2e      # Playwright E2E
npm run lint          # TypeScript type check
npm run build         # Compile TypeScript
npm run lint && npm run build && npm run test && forge test  # full verification
```

## Demo

```bash
npm run demo   # Live demo: creates on-chain claim job, AI evaluates, committee approves
```

The demo shows the full ERC-8183 lifecycle:
1. Pool initializes with Safe + ERC-8183 addresses
2. Members registered and streams synced
3. Claim submitted with AI evaluation
4. On-chain job created (if approved)
5. Committee approval and completion

## Security Features

- **Claim amount cap**: $10,000 per incident
- **Grace period**: 7-day stream grace after cancellation
- **Vouching**: Only active members can vouch
- **Signature freshness**: 7-day max age on claim signatures
- **Non-deterministic AI fallback**: If all evaluators fail, claim is flagged for manual review (not auto-denied)
- **Nonce-resilient**: Transaction retries on nonce conflicts
- **Spending guardrails**: Locus enforces per-transaction, daily, monthly limits on pool agent
- **Delegation scope**: MetaMask Delegation limits agent actions to explicit permissions

## Docker

```bash
docker-compose up --build
```

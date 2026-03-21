# Lido MCP Server Skill

> Give any AI agent the ability to stake, unstake, wrap, and govern Lido through natural language.

## What This Is

The Lido MCP Server exposes Lido's stETH staking primitives as MCP tools. Any AI agent (Claude, GPT, Gemini, etc.) can call these tools to manage stETH positions, wstETH on L2s, and Lido DAO governance — without custom integration code.

## Tools

### `lido_stake`
Stake ETH on Ethereum mainnet to receive stETH.
- `amountEth`: Amount to stake (e.g. "0.1")
- `privateKey`: Signing key

### `lido_unstake`
Request withdrawal of stETH for ETH (24-48h unbonding period).
- `amountStEth`: Amount to unstake
- `privateKey`: Signing key

### `lido_wrap`
Wrap stETH into wstETH on Base Sepolia (1:1, no unbonding).
- `amountStEth`: Amount to wrap
- `privateKey`: Signing key on Base

### `lido_unwrap`
Unwrap wstETH back to stETH on Base Sepolia.
- `amountWstEth`: Amount to unwrap
- `privateKey`: Signing key on Base

### `lido_balance`
Query stETH/wstETH balance and pending rewards for any address.
- `address`: Wallet to query
- `network`: "mainnet" or "base"

### `lido_rewards`
Get current stETH total supply and reward rate.

### `lido_governance_vote`
Vote on a Lido DAO proposal.
- `proposalId`: Proposal ID
- `support`: true = vote for, false = against
- `privateKey`: Signing key

### `lido_dry_run`
Simulate a stake/unstake operation without execution. Returns gas estimate.
- `operation`: "stake" or "unstake"
- `amount`: Amount in ETH
- `network`: "mainnet" or "base"

## Running

```bash
# Start the MCP server
npx tsx src/mcp/lido/server.ts

# Or build and run
npx tsc -p tsconfig.mcp.json
node dist/mcp/lido/server.js
```

## Mental Model for Agents

**stETH vs wstETH**: stETH is the liquid staking token on Ethereum mainnet. It rebases (balance increases daily). wstETH is wrapped stETH on L2s — it doesn't rebase, instead the rate changes. 1 wstETH = some amount of stETH that grows over time.

**Stake**: ETH → stETH. You get stETH 1:1 for ETH deposited.

**Wrap**: stETH (on Base) → wstETH. Used on L2s where you want a static-balance token.

**Yield**: stETH earns ~4-5% APY in ETH. The agent can only spend the yield, never the principal. This is enforced by the StETHTreasury contract.

**Unstaking**: stETH → ETH takes 24-48h via the Lido withdrawal queue. wstETH unwrap is instant on Base.

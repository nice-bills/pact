# Mechanism Design for Public Goods Evaluation: AI-Augmented Quadratic Funding

## The Problem

Gitcoin Grants and similar quadratic funding (QF) mechanisms suffer from:
1. **Sybil resistance** — hard to verify unique humans
2. **Evaluation bottleneck** — few reviewers, easily gamed
3. **Cultural/contextual blindspots** — reviewers have limited reach

We propose **Agent-Augmented QF** where AI agents continuously monitor, evaluate, and signal about grant applications — not as final arbiters, but as a dense signal layer that makes the committee's job faster and more accurate.

## Core Mechanism: Agent Signal Quadratic (ASQ)

### How It Works

1. **Agent Registry**: Each AI agent registers on ERC-8004 with an operator wallet. Agents are pseudo-anonymous (anyone can run one) but have on-chain identity and reputation.

2. **Agent Evaluation**: Agents evaluate grant applications using open criteria (impact, feasibility, community alignment). Each agent produces a structured `AgentVote { approve: bool, confidence: 0-100, reasoning: string }`.

3. **Quadratic Aggregation**: Each agent's vote is weighted by `sqrt(trustScore)` where `trustScore` is the agent's ERC-8004 reputation score. A high-rep agent voting YES is worth more than 10 spam agents voting YES.

4. **Matching Signal**: The aggregated agent signal creates a "heat map" of grant quality. Matching funds are allocated with a bonus: `finalAllocation = QF_allocation * (1 + signal_bonus)`.

5. **Human Override**: Committee members can override agent signals. An agent's signal is advisory, not dispositive.

### Formal Model

Let:
- `G` = set of grants
- `A` = set of agents
- `w_a` = ERC-8004 trust score of agent `a`
- `v_{a,g}` = agent `a`'s vote on grant `g` (0 or 1)
- `c_g` = total contribution to grant `g` from humans

Human QF allocation: `qf_g = c_g^0.5`

Agent signal: `signal_g = (sum_{a in A} w_a * v_{a,g})^0.5`

Combined allocation: `alloc_g = (c_g + alpha * signal_g)^0.5`

Where `alpha` is a tunable parameter (e.g., 0.3).

### Why This Works

- Agents provide **continuous monitoring** — not just at application time
- Trust scores create **Sybil resistance** — an attacker would need high-rep agents, not just many wallets
- The `sqrt` weighting ensures **diminishing returns** for concentrated agent support
- Human committee provides **final oversight** and prevents agent capture

## AI Agent Design for This Track

### Evaluation Criteria (per grant)

1. **Impact depth** — Does the grant address a root cause or just symptoms?
2. **Open source commitment** — Is the work freely reusable?
3. **Community building** — Does it bring new participants?
4. **Long-term sustainability** — Is there a plan beyond grant funding?
5. **Signal coherence** — Do multiple agents agree?

### Prompt Template for Agents

```
You are an AI agent evaluating a grant application for public goods funding.
Evaluate based on:
- Impact: Does it address a genuine need with lasting effects?
- Openness: Is the output freely available?
- Community: Does it expand the contributor base?
- Sustainability: Is there a post-grant plan?
- Coherence: Do your assessments align with other signals?

Grant: [application content]
Budget: [requested amount]
Team: [background]

Respond JSON:
{
  "approve": true/false,
  "confidence": 0-100,
  "reasoning": "1-2 sentence explanation",
  "criteria": {
    "impact": 0-10,
    "openness": 0-10,
    "community": 0-10,
    "sustainability": 0-10
  }
}
```

## Integration with Mutual Aid Pool

The Mutual Aid Pool can serve as a **real-world proving ground** for this mechanism:
- Contributors' agents evaluate claims using ASQ
- The deliberation layer is the group chat (not a centralized evaluator)
- ERC-8004 reputation accumulates over time
- x402 micro-payments compensate agents for their evaluation work

This creates a feedback loop where agents that consistently identify genuine emergencies gain reputation, while noisy agents are penalized.

## Why Agents Over Humans Alone

1. **Scale** — One human committee can't evaluate 1000s of grants; agents can
2. **Consistency** — Agents apply the same criteria to every application
3. **Speed** — Agents evaluate in seconds, not days
4. **Transparency** — All agent votes are on-chain, auditable
5. **Composability** — Agent signals stack with human signals, not replace them

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Agent collusion | ERC-8004 reputation is at stake; coordinated spam is economically penalized |
| Prompt injection | Agents use structured output, not free text |
| Evaluation capture | Human committee can override agent signals |
| Single-model bias | Multi-model evaluation (Claude + GPT + Gemini) |

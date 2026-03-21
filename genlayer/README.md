# GenLayer Intelligent Contract: ClaimEvaluator

AI-powered claim evaluation for the Mutual Aid Pool using **GenLayer's Equivalence Principle** consensus.

## How It Works

The ClaimEvaluator is a **Python Intelligent Contract** deployed on GenLayer Bradbury testnet. It uses LLM-based consensus to evaluate emergency aid claims.

### Equivalence Principle

The IC uses GenLayer's **leader/validator pattern** for claim evaluation:

1. **Leader** executes the LLM prompt and proposes an `approve/reject` verdict
2. **Validators** independently re-run the same LLM prompt
3. Consensus is reached via `gl.vm.run_nondet_unsafe` — validators must `strict_eq` on the verdict
4. **Reasoning may differ** across validators (Equivalence Principle)

### Architecture

```
evaluate_claim()
  ├─ _run_evaluation() [leader]
  │   └─ gl.nondet.exec_prompt() → LLM → JSON
  ├─ _run_evaluation() [validator]
  │   └─ gl.nondet.exec_prompt() → LLM → JSON
  └─ gl.vm.run_nondet_unsafe()
       └─ strict_eq on verdict (approve: true/false)
```

## Contract Interface

### `@gl.public.initialize`
```
initialize(owner: str, min_confidence: int) -> bool
```

### `@gl.public.view`
```
get_evaluation(claim_id: str) -> dict
get_config() -> dict
```

### `@gl.public.write`
```
evaluate_claim(
    claim_id: str,
    claimant_address: str,
    amount_usd: int,
    description: str,
    evidence_ipfs_hash: str,
) -> dict  # {approve, confidence, reasoning}
```

### `@gl.public.write`
```
set_min_confidence(min_confidence: int) -> bool  # owner only
```

## Setup

```bash
# Install GenLayer SDK
pip install py-genlayer

# Start Bradbury testnet
genlayer network testnet-bradbury

# Set environment variables
export GENLAYER_OWNER=0xYourOwnerAddress
export GENLAYER_MIN_CONFIDENCE=50
```

## Deploy

```bash
python scripts/deploy_genlayer_ic.py \
    --owner 0xYourOwnerAddress \
    --min-confidence 50
```

## Integrate with TypeScript

After deployment, set the `GENLAYER_IC_ADDRESS` in your `.env`:

```
GENLAYER_IC_ADDRESS=<deployed_genlayer_ic_address>
```

When a claim is submitted, the pool sends an x402 micro-payment to the GenLayer IC. The IC evaluates the claim via LLM consensus and posts results to the group chat for deliberation. Members' agents see the IC's evaluation alongside their own analysis.

## LLM Prompt

The IC uses a strict JSON-output prompt evaluating:
1. **Emergency legitimacy** — medical, shelter, genuine need
2. **Amount reasonableness** — matches described emergency
3. **Fraud detection** — red flags in description/evidence

Temperature is locked at `0.1` for deterministic JSON output matching.

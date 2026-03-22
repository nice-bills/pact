from genlayer import *


class ClaimEvaluator(gl.Contract):
    """
    GenLayer intelligent contract for evaluating mutual aid claims.
    Uses LLM to assess claim reasonableness and community value.
    Validators reach consensus on the evaluation via Optimistic Democracy.
    """

    data: TreeMap[int, dict]
    claim_count: int
    trusted_evaluators: TreeMap[Address, bool]

    def __init__(self):
        self.data = TreeMap()
        self.claim_count = 0
        self.trusted_evaluators = TreeMap()

    @gl.public.view
    def evaluate_claim(
        self,
        claim_id: int,
        evidence_hash: str,
        amount_usd: int,
        description: str,
        claimant_history: int,
    ) -> dict:
        """
        Evaluate a claim using LLM reasoning.
        Returns stars (1-5) and reason string.
        Non-deterministic — resolved via GenLayer consensus.
        """
        prompt = f"""
You are an impartial evaluator for a mutual aid pool.

Evaluate this claim and return a JSON object with:
- "stars": integer 1-5 (5 = strongly approve, 1 = reject)
- "reason": string explaining your reasoning
- "flags": list of any concerns (empty if none)

Claim details:
- Claim ID: {claim_id}
- Amount: ${amount_usd} USD
- Evidence IPFS hash: {evidence_hash}
- Description: {description}
- Claimant's prior claims: {claimant_history}

Evaluation criteria:
- Is the amount reasonable for the described need?
- Does the evidence support the claim?
- Is this a legitimate community need?
- Any red flags (amount mismatch, vague evidence, etc.)
"""
        result = gl.nondet.exec_prompt(prompt, response_format="json")

        if not isinstance(result, dict):
            raise gl.UserError("LLM returned invalid format")

        stars = result.get("stars", 1)
        if not isinstance(stars, int) or stars < 1 or stars > 5:
            stars = max(1, min(5, int(stars)))

        return {
            "stars": stars,
            "reason": result.get("reason", "No reason provided"),
            "flags": result.get("flags", []),
            "claim_id": claim_id,
            "amount_usd": amount_usd,
        }

    @gl.public.write
    def submit_evaluation(
        self,
        claim_id: int,
        stars: int,
        reason: str,
        flags: list,
    ):
        """
        Submit an evaluation. Stores on-chain with evaluator address.
        """
        if stars < 1 or stars > 5:
            raise gl.UserError("Stars must be between 1 and 5")

        if len(reason) > 500:
            raise gl.UserError("Reason too long (max 500 chars)")

        evaluation = {
            "stars": stars,
            "reason": reason,
            "flags": flags,
            "claim_id": claim_id,
            "evaluator": str(gl.message.sender_address),
        }

        key = f"{claim_id}_{gl.message.sender_address}"
        self.data[int(key.encode().hex(), 16) % 1000000] = evaluation

    @gl.public.view
    def get_claim_evaluations(self, claim_id: int) -> list:
        """
        Get all evaluations for a specific claim.
        Used by the pool to aggregate scores.
        """
        results = []
        for i in range(self.claim_count * 10):
            if i >= len(self.data):
                break
            val = self.data.get(i)
            if val and val.get("claim_id") == claim_id:
                results.append(val)
        return results

    @gl.public.view
    def get_average_stars(self, claim_id: int) -> float:
        """
        Calculate average stars for a claim.
        """
        evals = self.get_claim_evaluations(claim_id)
        if not evals:
            return 0.0
        total = sum(e["stars"] for e in evals)
        return total / len(evals)

    @gl.public.write
    def register_trusted_evaluator(self, addr: Address, trusted: bool):
        """
        Owner can mark certain addresses as trusted evaluators.
        """
        self.trusted_evaluators[addr] = trusted

    @gl.public.view
    def is_trusted_evaluator(self, addr: Address) -> bool:
        """
        Check if an evaluator is trusted.
        """
        return self.trusted_evaluators.get(addr, False)

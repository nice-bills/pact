"""
GenLayer Intelligent Contract: ClaimEvaluator

AI-powered claim evaluation for the Mutual Aid Pool using LLM consensus.
Deployed on GenLayer Bradbury testnet.

Equivalence Principle: validators must agree on approve/reject verdict,
but reasoning may differ (strict_eq on verdict, flexible on reasoning).
"""

import genlayer as gl


SYSTEM_PROMPT = """You are an insurance claim evaluator for a mutual aid pool.
Your job is to assess whether a claim for emergency funds is legitimate.

You will receive:
- A description of the emergency
- An IPFS hash linking to evidence (e.g. photo of a medical bill)
- The amount requested in USD

Evaluate based on:
1. Does the description match a genuine emergency (medical, urgent shelter, etc.)?
2. Is the amount reasonable for the described emergency?
3. Are there red flags suggesting fraud?

Respond in JSON format only:
{
  "approve": true/false,
  "confidence": 0-100,
  "reasoning": "Brief explanation"
}"""


class ClaimEvaluator(gl.Contract):
    def __init__(self):
        self.owner = gl.storage.get("owner")
        self.min_confidence = gl.storage.get("min_confidence")
        self.evaluations = gl.storage.get("evaluations")

    @gl.public.initialize
    def initialize(self, owner: str, min_confidence: int) -> bool:
        if self.owner is not None:
            raise Exception("Contract already initialized")
        gl.storage.set("owner", owner)
        gl.storage.set("min_confidence", min_confidence)
        gl.storage.set("evaluations", {})
        return True

    @gl.public.view
    def get_evaluation(self, claim_id: str) -> dict:
        evals = gl.storage.get("evaluations")
        if evals is None:
            return {}
        return evals.get(claim_id, {})

    @gl.public.view
    def get_config(self) -> dict:
        return {
            "owner": self.owner,
            "min_confidence": self.min_confidence,
        }

    @gl.public.write
    def evaluate_claim(
        self,
        claim_id: str,
        claimant_address: str,
        amount_usd: int,
        description: str,
        evidence_ipfs_hash: str,
    ) -> dict:
        if self.owner is None:
            raise Exception("Contract not initialized")

        user_message = (
            f"Emergency claim evaluation request:\n"
            f"- Claimant: {claimant_address}\n"
            f"- Amount requested: ${amount_usd}\n"
            f"- Description: {description}\n"
            f"- Evidence IPFS hash: {evidence_ipfs_hash}\n\n"
            f"Please evaluate this claim and respond in JSON format."
        )

        leader_result = self._run_evaluation(user_message)
        leader_verdict = leader_result["approve"]

        validator_result = self._run_evaluation(user_message)
        validator_verdict = validator_result["approve"]

        leader_calldata = leader_result
        validator_calldata = validator_result

        final_result = gl.vm.run_nondet_unsafe(
            lambda: (leader_verdict, leader_calldata),
            lambda result: (
                validator_verdict == result[0]
                and self._verdict_matches(validator_calldata, result[1])
            ),
        )

        gl.storage.set(
            "evaluations",
            {
                **gl.storage.get("evaluations"),
                claim_id: {
                    "approve": final_result["approve"],
                    "confidence": final_result["confidence"],
                    "reasoning": final_result["reasoning"],
                    "evaluated_at": gl.block.current().timestamp,
                    "claimant": claimant_address,
                    "amount_usd": amount_usd,
                },
            },
        )

        return final_result

    def _run_evaluation(self, user_message: str) -> dict:
        prompt_input = {"role": "user", "content": f"{SYSTEM_PROMPT}\n\n{user_message}"}
        raw = gl.nondet.exec_prompt([prompt_input], model="default", temperature=0.1)
        return self._parse_llm_response(raw)

    def _parse_llm_response(self, raw: str) -> dict:
        import json
        import re

        json_match = re.search(r"\{[\s\S]*\}", raw)
        if not json_match:
            return {
                "approve": False,
                "confidence": 0,
                "reasoning": f"Could not parse LLM response: {raw[:200]}",
            }
        parsed = json.loads(json_match.group(0))
        return {
            "approve": bool(parsed.get("approve", False)),
            "confidence": int(parsed.get("confidence", 0)),
            "reasoning": str(parsed.get("reasoning", "")),
        }

    def _verdict_matches(self, expected: dict, actual: dict) -> bool:
        return expected.get("approve") == actual.get("approve")

    @gl.public.write
    def set_min_confidence(self, min_confidence: int) -> bool:
        if self.owner is None:
            raise Exception("Contract not initialized")
        caller = gl.transaction.get_origin()
        if caller != self.owner:
            raise Exception("Only owner can set min_confidence")
        gl.storage.set("min_confidence", min_confidence)
        return True

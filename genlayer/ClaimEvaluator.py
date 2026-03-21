"""
GenLayer Intelligent Contract: ClaimEvaluator

AI-powered claim evaluation for the Mutual Aid Pool using LLM consensus.
Deployed on GenLayer Bradbury testnet.

Equivalence Principle: validators must agree on approve/reject verdict,
but reasoning may differ (strict_eq on verdict, flexible on reasoning).
"""

import genlayer as gl
import json as json_module
import re


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


def _parse_llm_response(raw: str) -> dict:
    json_match = re.search(r"\{[\s\S]*\}", raw)
    if not json_match:
        return {
            "approve": False,
            "confidence": 0,
            "reasoning": f"Could not parse LLM response: {raw[:200]}",
        }
    try:
        parsed = json_module.loads(json_match.group(0))
        return {
            "approve": bool(parsed.get("approve", False)),
            "confidence": max(0, min(100, int(parsed.get("confidence", 0)))),
            "reasoning": str(parsed.get("reasoning", "")),
        }
    except (json_module.JSONDecodeError, ValueError, TypeError):
        return {
            "approve": False,
            "confidence": 0,
            "reasoning": f"Malformed JSON in LLM response: {raw[:200]}",
        }


def _run_evaluation(user_message: str) -> dict:
    prompt_input = {
        "role": "user",
        "content": f"{SYSTEM_PROMPT}\n\n{user_message}"
    }
    raw = gl.nondet.exec_prompt([prompt_input], model="default", temperature=0.1)
    return _parse_llm_response(raw)


class ClaimEvaluator(gl.Contract):
    def __init__(self):
        self.owner = gl.storage.get("owner")
        self.min_confidence = gl.storage.get("min_confidence")
        self.evaluations = gl.storage.get("evaluations") or {}
        self._initialized = self.owner is not None

    @gl.public.initialize
    def initialize(self, owner: str, min_confidence: int) -> bool:
        if self._initialized:
            raise Exception("Contract already initialized")
        gl.storage.set("owner", owner)
        gl.storage.set("min_confidence", min_confidence)
        gl.storage.set("evaluations", {})
        self._initialized = True
        return True

    @gl.public.view
    def get_evaluation(self, claim_id: str) -> dict:
        evals = gl.storage.get("evaluations") or {}
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
        if not self._initialized:
            raise Exception("Contract not initialized")

        if not claim_id or not claim_id.strip():
            raise Exception("claim_id cannot be empty")

        user_message = (
            f"Emergency claim evaluation request:\n"
            f"- Claimant: {claimant_address}\n"
            f"- Amount requested: ${amount_usd}\n"
            f"- Description: {description}\n"
            f"- Evidence IPFS hash: {evidence_ipfs_hash}\n\n"
            f"Please evaluate this claim and respond in JSON format."
        )

        leader_result = _run_evaluation(user_message)
        leader_verdict = leader_result["approve"]
        leader_calldata = leader_result

        validator_result = _run_evaluation(user_message)
        validator_verdict = validator_result["approve"]
        validator_calldata = validator_result

        def leader_fn():
            return (leader_verdict, json_module.dumps(leader_calldata, sort_keys=True))

        def validator_fn(result):
            try:
                result_data = json_module.loads(result[1])
                return (
                    validator_verdict == result[0]
                    and validator_calldata.get("approve") == result_data.get("approve")
                )
            except (json_module.JSONDecodeError, TypeError, IndexError):
                return False

        agreed = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        if isinstance(agreed, gl.vm.Return):
            final_data = json_module.loads(agreed.calldata)
        else:
            final_data = leader_calldata

        evals = dict(gl.storage.get("evaluations") or {})
        evals[claim_id] = {
            "approve": final_data["approve"],
            "confidence": final_data["confidence"],
            "reasoning": final_data["reasoning"],
            "evaluated_at": gl.block.current().timestamp,
            "claimant": claimant_address,
            "amount_usd": amount_usd,
        }
        gl.storage.set("evaluations", evals)

        return final_data

    @gl.public.write
    def set_min_confidence(self, min_confidence: int) -> bool:
        if not self._initialized:
            raise Exception("Contract not initialized")
        caller = gl.transaction.get_origin()
        if caller != self.owner:
            raise Exception("Only owner can set min_confidence")
        if not (0 <= min_confidence <= 100):
            raise Exception("min_confidence must be between 0 and 100")
        gl.storage.set("min_confidence", min_confidence)
        return True

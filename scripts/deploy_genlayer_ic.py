#!/usr/bin/env python3
"""
Deploy ClaimEvaluator Intelligent Contract to GenLayer Bradbury testnet.

Usage:
    python scripts/deploy_genlayer_ic.py [--owner OWNER] [--min-confidence MIN]

Requirements:
    pip install py-genlayer
    genlayer network testnet-bradbury  # ensure running
"""

import argparse
import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

try:
    from genlayer import GenEngine, GlialNode
except ImportError:
    print("Error: py-genlayer not installed. Run: pip install py-genlayer")
    sys.exit(1)


DEFAULT_OWNER = "0x0000000000000000000000000000000000000000"
DEFAULT_MIN_CONFIDENCE = 50


def deploy_claim_evaluator(owner: str, min_confidence: int) -> dict:
    contract_code = """
import genlayer as gl


SYSTEM_PROMPT = \"\"\"You are an insurance claim evaluator for a mutual aid pool.
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
}\"\"\"


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
            f"Emergency claim evaluation request:\\n"
            f"- Claimant: {claimant_address}\\n"
            f"- Amount requested: ${amount_usd}\\n"
            f"- Description: {description}\\n"
            f"- Evidence IPFS hash: {evidence_ipfs_hash}\\n\\n"
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
        import re
        import json as json_module

        prompt_input = {"role": "user", "content": f"{SYSTEM_PROMPT}\\n\\n{user_message}"}
        raw = gl.nondet.exec_prompt([prompt_input], model="default", temperature=0.1)
        json_match = re.search(r'\\{[\\s\\S]*\\}', raw)
        if not json_match:
            return {
                "approve": False,
                "confidence": 0,
                "reasoning": f"Could not parse LLM response: {raw[:200]}",
            }
        parsed = json_module.loads(json_match.group(0))
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
"""

    try:
        node = GlialNode()
        result = node.deploy(
            contract_code=contract_code,
            constructor_args={
                "owner": owner,
                "min_confidence": min_confidence,
            },
            network="testnet-bradbury",
        )

        deployed_info = {
            "address": result.get("address", "pending"),
            "transaction_hash": result.get("transaction_hash", ""),
            "status": result.get("status", "deployed"),
            "contract_class": "ClaimEvaluator",
            "network": "testnet-bradbury",
            "config": {
                "owner": owner,
                "min_confidence": min_confidence,
            },
        }

        print("\n=== ClaimEvaluator IC Deployed ===")
        print(json.dumps(deployed_info, indent=2))
        return deployed_info

    except Exception as e:
        print(f"Deployment failed: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Deploy ClaimEvaluator IC to Bradbury")
    parser.add_argument(
        "--owner",
        type=str,
        default=os.environ.get("GENLAYER_OWNER", DEFAULT_OWNER),
        help="Owner address (default: GENLAYER_OWNER env var)",
    )
    parser.add_argument(
        "--min-confidence",
        type=int,
        default=int(os.environ.get("GENLAYER_MIN_CONFIDENCE", DEFAULT_MIN_CONFIDENCE)),
        help="Minimum confidence threshold 0-100 (default: 50)",
    )
    args = parser.parse_args()

    result = deploy_claim_evaluator(args.owner, args.min_confidence)
    print(f"\nDeployed at: {result['address']}")


if __name__ == "__main__":
    main()

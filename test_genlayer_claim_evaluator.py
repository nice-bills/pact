"""
GenLayer ClaimEvaluator IC - Integration Tests

These tests require a running GenLayer Bradbury testnet and py-genlayer SDK.

Setup:
    python -m venv .venv && source .venv/bin/activate
    pip install py-genlayer  # requires network access to pypi.genlayer.com or PyPI
    export GENLAYER_RPC_URL=https://bradbury.genlayer.com/rpc
    export DEPLOYER_PRIVATE_KEY=0x...
    export CLAIM_EVALUATOR_ADDRESS=0x...  # deployed IC address

Run:
    python -m pytest test_genlayer_claim_evaluator.py -v

Note: If Bradbury testnet is unreachable (DNS/firewall), tests will skip automatically.
"""

import os
import pytest

def _check_network():
    """Return True if Bradbury testnet is reachable."""
    try:
        import urllib.request
        req = urllib.request.urlopen("https://bradbury.genlayer.com/rpc", timeout=5)
        return req.status == 200
    except Exception:
        return False

bradbury_reachable = _check_network()


class TestClaimEvaluator:
    """Integration tests for ClaimEvaluator IC on Bradbury testnet."""

    @pytest.fixture
    def contract_address(self):
        """Return deployed ClaimEvaluator address from CLAIM_EVALUATOR_ADDRESS env."""
        if not bradbury_reachable:
            pytest.skip("Bradbury testnet unreachable (DNS/network issue)")
        try:
            import genlayer
        except ImportError:
            pytest.skip("py-genlayer not installed: pip install genlayer")
        import os
        addr = os.environ.get("CLAIM_EVALUATOR_ADDRESS")
        if not addr:
            pytest.skip("CLAIM_EVALUATOR_ADDRESS not set")
        return addr

    def test_initialize_sets_owner(self, contract_address):
        """Initialize contract and verify owner is set."""
        from genlayer import gl

        result = gl.vm.run(
            "read",
            contract_address,
            "get_config",
            []
        )
        assert result["owner"] is not None

    def test_evaluate_claim_returns_approve(self, contract_address):
        """Submit a claim and verify AI evaluation returns structured response."""
        from genlayer import gl

        result = gl.vm.run(
            "write",
            contract_address,
            "evaluate_claim",
            [
                "test-claim-001",
                "0x0000000000000000000000000000000000000001",
                500,
                "Medical emergency - hospital bills",
                "QmTestEvidence123"
            ]
        )
        assert "approve" in result
        assert "confidence" in result
        assert "reasoning" in result
        assert isinstance(result["approve"], bool)
        assert 0 <= result["confidence"] <= 100

    def test_evaluate_claim_stores_result(self, contract_address):
        """Verify evaluation is stored and retrievable by claim_id."""
        from genlayer import gl

        claim_id = "test-claim-002"
        gl.vm.run(
            "write",
            contract_address,
            "evaluate_claim",
            [
                claim_id,
                "0x0000000000000000000000000000000000000001",
                1000,
                "Emergency home repair after storm damage",
                "QmTestEvidence456"
            ]
        )

        stored = gl.vm.run(
            "read",
            contract_address,
            "get_evaluation",
            [claim_id]
        )
        assert stored["approve"] is not None
        assert stored["amount_usd"] == 1000

    def test_empty_claim_id_reverts(self, contract_address):
        """Passing empty claim_id should revert."""
        from genlayer import gl

        with pytest.raises(Exception):
            gl.vm.run(
                "write",
                contract_address,
                "evaluate_claim",
                [
                    "",
                    "0x0000000000000000000000000000000000000001",
                    500,
                    "Test claim",
                    "QmTest"
                ]
            )

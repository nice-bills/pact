// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../../contracts/AgenticCommerce.sol";

contract AgenticCommerceTest is Test {
    AgenticCommerce public commerce;
    MockERC20 public paymentToken;
    address public treasury = address(0x1234);
    address public client = address(0xABCD);
    address public provider = address(0xDEF0);
    address public evaluator = address(0xFEED);
    uint constant PLATFORM_FEE_BP = 250;

    function setUp() public {
        paymentToken = new MockERC20();
        commerce = new AgenticCommerce(address(paymentToken), treasury, PLATFORM_FEE_BP);
        vm.deal(client, 10 ether);
        vm.deal(evaluator, 10 ether);
    }

    function test_constructor_sets_state() public view {
        assertEq(address(commerce.paymentToken()), address(paymentToken));
        assertEq(commerce.platformTreasury(), treasury);
        assertEq(commerce.platformFeeBP(), PLATFORM_FEE_BP);
    }

    function test_createJob_emits_event_and_increments_counter() public {
        uint expiry = block.timestamp + 7 days;
        vm.prank(client);
        uint jobId = commerce.createJob(provider, evaluator, expiry, "Medical emergency fund request");
        assertEq(jobId, 1);
        assertEq(commerce.jobCounter(), 1);
        AgenticCommerce.Job memory job = commerce.getJob(1);
        assertEq(job.id, 1);
        assertEq(job.client, client);
        assertEq(job.evaluator, evaluator);
        assertEq(job.provider, provider);
        assertEq(job.expiredAt, expiry);
        assertEq(uint(job.status), uint(AgenticCommerce.JobStatus.Open));
        assertEq(job.budget, 0);
    }

    function test_createJob_reverts_zero_evaluator() public {
        uint expiry = block.timestamp + 7 days;
        vm.prank(client);
        vm.expectRevert(abi.encodeWithSignature("ZeroAddress()"));
        commerce.createJob(provider, address(0), expiry, "Test");
    }

    function test_createJob_reverts_short_expiry() public {
        uint expiry = block.timestamp + 4 minutes;
        vm.prank(client);
        vm.expectRevert(abi.encodeWithSignature("ExpiryTooShort()"));
        commerce.createJob(provider, evaluator, expiry, "Test");
    }

    function test_setBudget_updates_job_budget() public {
        uint expiry = block.timestamp + 7 days;
        vm.prank(client);
        uint jobId = commerce.createJob(provider, evaluator, expiry, "Test");
        vm.prank(client);
        commerce.setBudget(jobId, 1000e6);
        AgenticCommerce.Job memory job = commerce.getJob(jobId);
        assertEq(uint(job.status), uint(AgenticCommerce.JobStatus.Open));
        assertEq(job.budget, 1000e6);
    }

    function test_fund_transfers_tokens_and_sets_status_Funded() public {
        uint expiry = block.timestamp + 7 days;
        uint budget = 500e6;
        paymentToken.mint(client, budget);
        vm.prank(client);
        paymentToken.approve(address(commerce), budget);
        vm.prank(client);
        uint jobId = commerce.createJob(provider, evaluator, expiry, "Test");
        vm.prank(client);
        commerce.setBudget(jobId, budget);
        vm.prank(client);
        commerce.fund(jobId);
        assertEq(paymentToken.balanceOf(address(commerce)), budget);
        AgenticCommerce.Job memory job = commerce.getJob(jobId);
        assertEq(uint(job.status), uint(AgenticCommerce.JobStatus.Funded));
    }

    function test_fund_reverts_if_no_provider() public {
        uint expiry = block.timestamp + 7 days;
        uint budget = 500e6;
        paymentToken.mint(client, budget);
        vm.prank(client);
        paymentToken.approve(address(commerce), budget);
        vm.prank(client);
        uint jobId = commerce.createJob(address(0), evaluator, expiry, "Test");
        vm.prank(client);
        commerce.setBudget(jobId, budget);
        vm.prank(client);
        vm.expectRevert(abi.encodeWithSignature("ProviderNotSet()"));
        commerce.fund(jobId);
    }

    function test_fund_reverts_if_expired() public {
        uint budget = 500e6;
        vm.warp(1 minutes);
        paymentToken.mint(client, budget);
        vm.prank(client);
        paymentToken.approve(address(commerce), budget);
        vm.prank(client);
        uint expiry = block.timestamp + 6 minutes;
        uint jobId = commerce.createJob(provider, evaluator, expiry, "Test");
        vm.prank(client);
        commerce.setBudget(jobId, budget);
        vm.warp(block.timestamp + 7 minutes);
        vm.prank(client);
        vm.expectRevert(abi.encodeWithSignature("WrongStatus()"));
        commerce.fund(jobId);
    }

    function test_submit_sets_status_Submitted() public {
        _fund_job();
        vm.prank(provider);
        commerce.submit(1, bytes32("QmEvidenceHash123"));
        AgenticCommerce.Job memory job = commerce.getJob(1);
        assertEq(uint(job.status), uint(AgenticCommerce.JobStatus.Submitted));
    }

    function test_submit_reverts_wrong_status() public {
        uint expiry = block.timestamp + 7 days;
        vm.prank(client);
        uint jobId = commerce.createJob(provider, evaluator, expiry, "Test");
        vm.prank(provider);
        vm.expectRevert(abi.encodeWithSignature("WrongStatus()"));
        commerce.submit(jobId, bytes32("QmEvidence"));
    }

    function test_submit_reverts_unauthorized() public {
        _fund_job();
        address wrongProvider = address(0xCAFE);
        vm.prank(wrongProvider);
        vm.expectRevert(abi.encodeWithSignature("Unauthorized()"));
        commerce.submit(1, bytes32("QmEvidence"));
    }

    function test_complete_pays_provider_and_treasury() public {
        uint budget = 1000e6;
        _fund_job_with_budget(budget);
        vm.prank(provider);
        commerce.submit(1, bytes32("QmEvidence"));
        uint treasuryBefore = paymentToken.balanceOf(treasury);
        uint providerBefore = paymentToken.balanceOf(provider);
        vm.prank(evaluator);
        commerce.complete(1, bytes32("Approved by committee"));
        uint fee = (budget * PLATFORM_FEE_BP) / 10000;
        uint net = budget - fee;
        assertEq(paymentToken.balanceOf(provider), providerBefore + net);
        assertEq(paymentToken.balanceOf(treasury), treasuryBefore + fee);
        AgenticCommerce.Job memory job = commerce.getJob(1);
        assertEq(uint(job.status), uint(AgenticCommerce.JobStatus.Completed));
    }

    function test_complete_reverts_unauthorized_evaluator() public {
        _fund_job_with_budget(500e6);
        vm.prank(provider);
        commerce.submit(1, bytes32("QmEvidence"));
        address wrongEvaluator = address(0xBEEF);
        vm.prank(wrongEvaluator);
        vm.expectRevert(abi.encodeWithSignature("Unauthorized()"));
        commerce.complete(1, bytes32("reason"));
    }

    function test_reject_refunds_client() public {
        uint budget = 500e6;
        _fund_job_with_budget(budget);
        uint clientBefore = paymentToken.balanceOf(client);
        vm.prank(evaluator);
        commerce.reject(1, keccak256(bytes("Insufficient documentation")));
        assertEq(paymentToken.balanceOf(client), clientBefore + budget);
        AgenticCommerce.Job memory job = commerce.getJob(1);
        assertEq(uint(job.status), uint(AgenticCommerce.JobStatus.Rejected));
    }

    function test_reject_open_job_allows_client_rejection() public {
        uint expiry = block.timestamp + 7 days;
        uint budget = 300e6;
        paymentToken.mint(client, budget);
        vm.prank(client);
        paymentToken.approve(address(commerce), budget);
        vm.prank(client);
        uint jobId = commerce.createJob(provider, evaluator, expiry, "Test");
        vm.prank(client);
        commerce.setBudget(jobId, budget);
        vm.prank(client);
        commerce.fund(jobId);
        vm.prank(evaluator);
        commerce.reject(jobId, bytes32("Changed my mind"));
        assertEq(paymentToken.balanceOf(client), budget);
    }

    function test_claimRefund_refunds_client_after_expiry() public {
        _fund_job_with_budget(500e6);
        vm.warp(block.timestamp + 8 days);
        uint clientBefore = paymentToken.balanceOf(client);
        vm.prank(client);
        commerce.claimRefund(1);
        assertEq(paymentToken.balanceOf(client), clientBefore + 500e6);
        AgenticCommerce.Job memory job = commerce.getJob(1);
        assertEq(uint(job.status), uint(AgenticCommerce.JobStatus.Expired));
    }

    function test_claimRefund_reverts_before_expiry() public {
        _fund_job();
        vm.prank(client);
        vm.expectRevert(abi.encodeWithSignature("WrongStatus()"));
        commerce.claimRefund(1);
    }

    function test_getJob_returns_correct_struct() public {
        uint expiry = block.timestamp + 7 days;
        vm.prank(client);
        uint jobId = commerce.createJob(provider, evaluator, expiry, "Medical emergency");
        AgenticCommerce.Job memory job = commerce.getJob(jobId);
        assertEq(job.id, jobId);
        assertEq(job.client, client);
        assertEq(job.evaluator, evaluator);
        assertEq(job.provider, provider);
        assertEq(job.budget, 0);
        assertEq(uint(job.status), uint(AgenticCommerce.JobStatus.Open));
    }

    function _fund_job() internal {
        _fund_job_with_budget(500e6);
    }

    function _fund_job_with_budget(uint budget) internal {
        uint expiry = block.timestamp + 7 days;
        paymentToken.mint(client, budget);
        vm.prank(client);
        paymentToken.approve(address(commerce), budget);
        vm.prank(client);
        uint jobId = commerce.createJob(provider, evaluator, expiry, "Test");
        vm.prank(client);
        commerce.setBudget(jobId, budget);
        vm.prank(client);
        commerce.fund(jobId);
    }
}

contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient balance");
        require(allowance[from][msg.sender] >= amount, "insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

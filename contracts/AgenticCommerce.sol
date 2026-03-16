// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AgenticCommerce is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum JobStatus { Open, Funded, Submitted, Completed, Rejected, Expired }

    struct Job {
        uint256 id;
        address client;
        address provider;
        address evaluator;
        string description;
        uint256 budget;
        uint256 expiredAt;
        JobStatus status;
    }

    IERC20 public immutable paymentToken;
    address public platformTreasury;
    uint256 public platformFeeBP;

    uint256 public jobCounter;
    mapping(uint256 => Job) public jobs;

    event JobCreated(uint256 indexed jobId, address client, address provider, address evaluator, uint256 expiredAt);
    event ProviderSet(uint256 indexed jobId, address provider);
    event BudgetSet(uint256 indexed jobId, uint256 amount);
    event JobFunded(uint256 indexed jobId, address client, uint256 amount);
    event JobSubmitted(uint256 indexed jobId, address provider, bytes32 deliverable);
    event JobCompleted(uint256 indexed jobId, address evaluator, bytes32 reason);
    event JobRejected(uint256 indexed jobId, address rejector, bytes32 reason);
    event JobExpired(uint256 indexed jobId);
    event PaymentReleased(uint256 indexed jobId, address provider, uint256 amount);
    event Refunded(uint256 indexed jobId, address client, uint256 amount);

    error ZeroAddress();
    error ExpiryTooShort();
    error InvalidJob();
    error WrongStatus();
    error Unauthorized();
    error ProviderNotSet();

    constructor(address token_, address treasury_, uint256 feeBP_) {
        paymentToken = IERC20(token_);
        platformTreasury = treasury_;
        platformFeeBP = feeBP_;
    }

    function createJob(
        address provider, address evaluator, uint256 expiredAt, string calldata description
    ) external nonReentrant returns (uint256) {
        if (evaluator == address(0)) revert ZeroAddress();
        if (expiredAt <= block.timestamp + 5 minutes) revert ExpiryTooShort();

        uint256 jobId = ++jobCounter;
        jobs[jobId] = Job({
            id: jobId,
            client: msg.sender,
            provider: provider,
            evaluator: evaluator,
            description: description,
            budget: 0,
            expiredAt: expiredAt,
            status: JobStatus.Open
        });

        emit JobCreated(jobId, msg.sender, provider, evaluator, expiredAt);
        return jobId;
    }

    function setProvider(uint256 jobId, address provider_) external {
        Job storage job = jobs[jobId];
        if (job.id == 0) revert InvalidJob();
        if (job.status != JobStatus.Open) revert WrongStatus();
        if (msg.sender != job.client) revert Unauthorized();
        if (job.provider != address(0)) revert WrongStatus();
        if (provider_ == address(0)) revert ZeroAddress();
        job.provider = provider_;
        emit ProviderSet(jobId, provider_);
    }

    function setBudget(uint256 jobId, uint256 amount) external nonReentrant {
        Job storage job = jobs[jobId];
        if (job.id == 0) revert InvalidJob();
        if (job.status != JobStatus.Open) revert WrongStatus();
        if (msg.sender != job.client && msg.sender != job.provider) revert Unauthorized();
        job.budget = amount;
        emit BudgetSet(jobId, amount);
    }

    function fund(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        if (job.id == 0) revert InvalidJob();
        if (job.status != JobStatus.Open) revert WrongStatus();
        if (msg.sender != job.client) revert Unauthorized();
        if (job.provider == address(0)) revert ProviderNotSet();
        if (block.timestamp >= job.expiredAt) revert WrongStatus();

        job.status = JobStatus.Funded;
        if (job.budget > 0) {
            paymentToken.safeTransferFrom(job.client, address(this), job.budget);
        }
        emit JobFunded(jobId, job.client, job.budget);
    }

    function submit(uint256 jobId, bytes32 deliverable) external nonReentrant {
        Job storage job = jobs[jobId];
        if (job.id == 0) revert InvalidJob();
        if (job.status != JobStatus.Funded) revert WrongStatus();
        if (msg.sender != job.provider) revert Unauthorized();

        job.status = JobStatus.Submitted;
        emit JobSubmitted(jobId, job.provider, deliverable);
    }

    function complete(uint256 jobId, bytes32 reason) external nonReentrant {
        Job storage job = jobs[jobId];
        if (job.id == 0) revert InvalidJob();
        if (job.status != JobStatus.Submitted) revert WrongStatus();
        if (msg.sender != job.evaluator) revert Unauthorized();

        job.status = JobStatus.Completed;

        uint256 amount = job.budget;
        uint256 fee = (amount * platformFeeBP) / 10000;
        uint256 net = amount - fee;

        if (fee > 0) paymentToken.safeTransfer(platformTreasury, fee);
        if (net > 0) paymentToken.safeTransfer(job.provider, net);

        emit JobCompleted(jobId, job.evaluator, reason);
        emit PaymentReleased(jobId, job.provider, net);
    }

    function reject(uint256 jobId, bytes32 reason) external nonReentrant {
        Job storage job = jobs[jobId];
        if (job.id == 0) revert InvalidJob();

        if (job.status == JobStatus.Open) {
            if (msg.sender != job.client) revert Unauthorized();
        } else if (job.status == JobStatus.Funded || job.status == JobStatus.Submitted) {
            if (msg.sender != job.evaluator) revert Unauthorized();
        } else {
            revert WrongStatus();
        }

        JobStatus prev = job.status;
        job.status = JobStatus.Rejected;

        if ((prev == JobStatus.Funded || prev == JobStatus.Submitted) && job.budget > 0) {
            paymentToken.safeTransfer(job.client, job.budget);
            emit Refunded(jobId, job.client, job.budget);
        }

        emit JobRejected(jobId, msg.sender, reason);
    }

    function claimRefund(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        if (job.id == 0) revert InvalidJob();
        if (job.status != JobStatus.Funded && job.status != JobStatus.Submitted) revert WrongStatus();
        if (block.timestamp < job.expiredAt) revert WrongStatus();

        job.status = JobStatus.Expired;
        if (job.budget > 0) {
            paymentToken.safeTransfer(job.client, job.budget);
            emit Refunded(jobId, job.client, job.budget);
        }
        emit JobExpired(jobId);
    }

    function getJob(uint256 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }
}

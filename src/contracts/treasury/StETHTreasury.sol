// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title StETH Agent Treasury
/// @notice Allows humans to give AI agents a yield-bearing operating budget backed by stETH,
///         where only the yield (not principal) can be spent by the agent.
/// @dev Principal is structurally inaccessible to the agent. Only accumulated yield
///      can be drawn via spend(). Agent can query yield balance but never touches principal.
contract StETHTreasury is ReentrancyGuard {
    IERC20 public immutable stETH;
    IERC20 public immutable wstETH;

    mapping(address => uint256) public principal;
    mapping(address => uint256) public yieldBalance;
    mapping(address => uint256) public lastAccrualTime;

    mapping(address => bool) public allowedRecipients;
    mapping(address => uint256) public spendingCaps;
    mapping(address => mapping(address => uint256)) public spentThisPeriod;
    mapping(address => uint256) public periodStart;

    uint256 public constant ANNUAL_YIELD_BPS = 500; // 5% APY estimate — DEMO ONLY; replace with real Lido APY oracle for production
    uint256 public constant BPS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    address public immutable HUMAN;
    address public agent;

    event Deposit(address indexed human, uint256 amount, uint256 yieldAccrued);
    event YieldWithdrawn(address indexed agent, address indexed recipient, uint256 amount);
    event RecipientAllowed(address indexed agent, address indexed recipient);
    event SpendingCapSet(address indexed agent, uint256 cap);
    event AgentSet(address indexed human, address indexed newAgent);

    /// @param _stETH stETH token address (Ethereum mainnet)
    /// @param _wstETH wstETH token address (L2 where wstETH is bridged)
    /// @param _agent The AI agent wallet that can spend only the yield
    constructor(address _stETH, address _wstETH, address _agent) {
        stETH = IERC20(_stETH);
        wstETH = IERC20(_wstETH);
        HUMAN = msg.sender;
        agent = _agent;
    }

    /// @notice Human deposits stETH as principal. Yield accrues over time.
    /// @param amount Amount of stETH to deposit as principal
    function deposit(uint256 amount) external {
        require(msg.sender == HUMAN, "Only human can deposit");
        _accrue(msg.sender);

        require(stETH.transferFrom(HUMAN, address(this), amount), "stETH transfer failed");
        principal[HUMAN] += amount;

        emit Deposit(HUMAN, amount, 0);
    }

    /// @notice Agent withdraws accumulated yield to a recipient.
    /// @param recipient Address to send the yield funds
    /// @param amount Amount of yield to withdraw
    function spend(address recipient, uint256 amount) external nonReentrant {
        require(msg.sender == agent, "Only agent can spend");
        _accrue(HUMAN);

        require(amount <= yieldBalance[HUMAN], "Insufficient yield balance");
        require(amount > 0, "Cannot withdraw 0");

        // Check recipient whitelist if enabled
        if (allowedRecipients[HUMAN]) {
            require(recipient == HUMAN || allowedRecipients[recipient], "Recipient not allowed");
        }

        // Check spending cap
        uint256 cap = spendingCaps[HUMAN];
        if (cap > 0) {
            uint256 spent = spentThisPeriod[HUMAN][recipient];
            require(spent + amount <= cap, "Spending cap exceeded");
            spentThisPeriod[HUMAN][recipient] = spent + amount;
        }

        yieldBalance[HUMAN] -= amount;
        require(stETH.transfer(recipient, amount), "stETH transfer failed");

        emit YieldWithdrawn(agent, recipient, amount);
    }

    /// @notice Agent queries how much yield is available to spend.
    /// @return yieldAvailable Amount of yield accumulated but not yet withdrawn
    /// @return totalPrincipal Total stETH principal deposited by human
    function queryYield() external view returns (uint256 yieldAvailable, uint256 totalPrincipal) {
        totalPrincipal = principal[HUMAN];
        yieldAvailable = yieldBalance[HUMAN];
    }

    /// @notice Human enables/disables recipient whitelist mode, and sets individually allowed recipients.
    /// @param enabled True to require agents to only spend to HUMAN or explicitly allowed recipients
    /// @param recipient Address to allow (only checked if enabled is true)
    /// @param allowed True to allow, false to disallow
    function setRecipientAllowed(bool enabled, address recipient, bool allowed) external {
        require(msg.sender == HUMAN, "Only human can set recipients");
        allowedRecipients[HUMAN] = enabled;
        if (enabled) {
            allowedRecipients[recipient] = allowed;
        }
        emit RecipientAllowed(HUMAN, recipient);
    }

    /// @notice Human sets a spending cap for the agent per period.
    /// @param cap Maximum amount agent can spend per period (0 = no cap)
    /// @param periodSeconds Length of the period (resets counter)
    function setSpendingCap(uint256 cap, uint256 periodSeconds) external {
        require(msg.sender == HUMAN, "Only human can set caps");
        spendingCaps[HUMAN] = cap;
        periodStart[HUMAN] = block.timestamp;
        emit SpendingCapSet(HUMAN, cap);
    }

    /// @notice Human updates the agent address.
    /// @param newAgent New agent wallet address
    function setAgent(address newAgent) external {
        require(msg.sender == HUMAN, "Only human can set agent");
        require(newAgent != address(0), "Agent cannot be zero address");
        agent = newAgent;
        emit AgentSet(HUMAN, newAgent);
    }

    /// @notice Convert wstETH to stETH internally (for L2 deployments using wstETH).
    /// @param amount Amount of wstETH to unwrap to stETH
    function unwrapWstEth(uint256 amount) internal {
        (bool success, ) = address(wstETH).call(
            abi.encodeWithSignature("unwrap(uint256)", amount)
        );
        require(success, "wstETH unwrap failed");
    }

    function _accrue(address user) internal {
        if (principal[user] == 0) return;
        uint256 elapsed = block.timestamp - lastAccrualTime[user];
        if (elapsed == 0) return;
        uint256 accrued = (principal[user] * ANNUAL_YIELD_BPS * elapsed) / (BPS * SECONDS_PER_YEAR);
        yieldBalance[user] += accrued;
        lastAccrualTime[user] = block.timestamp;
    }

    // Make contract receive stETH from Lido staking
    receive() external payable {}
}

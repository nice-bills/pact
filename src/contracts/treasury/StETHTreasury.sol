// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title StETH Agent Treasury
/// @notice Allows humans to give AI agents a yield-bearing operating budget backed by stETH,
///         where only the yield (not principal) can be spent by the agent.
/// @dev Principal is structurally inaccessible to the agent. Only accumulated yield
///      can be drawn via spend(). Agent can query yield balance but never touches principal.
///      Yield is calculated using Lido's real-time APR oracle via stETH.getAPR().
contract StETHTreasury is ReentrancyGuard {
    IERC20 public immutable stETH;
    IERC20 public immutable wstETH;
    address public immutable LIDO_ORACLE;

    mapping(address => uint256) public principal;
    mapping(address => uint256) public yieldBalance;
    mapping(address => uint256) public lastAccrualTime;

    mapping(address => bool) public allowedRecipients;
    mapping(address => uint256) public spendingCaps;
    mapping(address => mapping(address => uint256)) public spentThisPeriod;
    mapping(address => uint256) public periodStart;

    uint256 public constant BPS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    address public immutable HUMAN;
    address public agent;

    event Deposit(address indexed human, uint256 amount, uint256 yieldAccrued);
    event YieldWithdrawn(address indexed agent, address indexed recipient, uint256 amount);
    event RecipientAllowed(address indexed agent, address indexed recipient);
    event SpendingCapSet(address indexed agent, uint256 cap);
    event AgentSet(address indexed human, address indexed newAgent);
    event APRUpdated(uint256 apr);

    /// @param _stETH stETH token address (Ethereum mainnet, e.g. 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84)
    /// @param _wstETH wstETH token address (for L2 where wstETH is bridged)
    /// @param _agent The AI agent wallet that can spend only the yield
    constructor(address _stETH, address _wstETH, address _agent) {
        stETH = IERC20(_stETH);
        wstETH = IERC20(_wstETH);
        LIDO_ORACLE = _stETH;
        HUMAN = msg.sender;
        agent = _agent;
    }

    /// @notice Returns the current Lido APR in basis points. Calls stETH.getAPR() on-chain.
    /// @dev stETH rebases daily — this oracle gives the protocol's own APR estimate.
    ///      Returns 0 if the oracle call fails (fallback to conservative 300bps).
    function getCurrentAPR() public view returns (uint256 aprBps) {
        (bool success, bytes memory data) = LIDO_ORACLE.staticcall(
            abi.encodeWithSignature("getAPR()")
        );
        if (success && data.length >= 32) {
            aprBps = abi.decode(data, (uint256));
        } else {
            aprBps = 300;
        }
    }

    /// @notice Human deposits stETH as principal. Yield accrues over time using real Lido APR.
    /// @param amount Amount of stETH to deposit as principal
    function deposit(uint256 amount) external {
        require(msg.sender == HUMAN, "Only human can deposit");
        _accrue(msg.sender);

        require(stETH.transferFrom(HUMAN, address(this), amount), "stETH transfer failed");
        principal[HUMAN] += amount;

        emit Deposit(HUMAN, amount, 0);
    }

    /// @notice Agent withdraws accumulated yield to a recipient. Only yield, never principal.
    /// @param recipient Address to send the yield funds
    /// @param amount Amount of yield to withdraw
    function spend(address recipient, uint256 amount) external nonReentrant {
        require(msg.sender == agent, "Only agent can spend");
        _accrue(HUMAN);

        require(amount <= yieldBalance[HUMAN], "Insufficient yield balance");
        require(amount > 0, "Cannot withdraw 0");

        if (allowedRecipients[HUMAN]) {
            require(recipient == HUMAN || allowedRecipients[recipient], "Recipient not allowed");
        }

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

    /// @notice Human enables/disables recipient whitelist mode.
    /// @param enabled True to require agents to only spend to HUMAN or explicitly allowed recipients
    /// @param recipient Address to allow
    /// @param allowed True to allow, false to disallow
    function setRecipientAllowed(bool enabled, address recipient, bool allowed) external {
        require(msg.sender == HUMAN, "Only human can set recipients");
        allowedRecipients[HUMAN] = enabled;
        if (enabled) {
            allowedRecipients[recipient] = allowed;
        }
        emit RecipientAllowed(HUMAN, recipient);
    }

    /// @notice Human sets a spending cap for the agent per period (0 = no cap).
    /// @param cap Maximum amount agent can spend per period
    /// @param periodSeconds Length of the period
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

    /// @dev Accrues yield using Lido's real-time APR oracle.
    ///      Falls back to 300bps if oracle call fails.
    function _accrue(address user) internal {
        if (principal[user] == 0) return;
        uint256 elapsed = block.timestamp - lastAccrualTime[user];
        if (elapsed == 0) return;
        uint256 aprBps = getCurrentAPR();
        uint256 accrued = (principal[user] * aprBps * elapsed) / (BPS * SECONDS_PER_YEAR);
        yieldBalance[user] += accrued;
        lastAccrualTime[user] = block.timestamp;
        emit APRUpdated(aprBps);
    }

    receive() external payable {}
}

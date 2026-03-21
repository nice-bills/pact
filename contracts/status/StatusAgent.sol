// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

/// @title StatusAgent
/// @notice Minimal agent registry for Status Network — part of Mutual Aid Pool
/// @dev AI agents register their identity on-chain. Gasless calls enabled by Status Network L2.
contract StatusAgent {
    struct Agent {
        address agentAddress;
        string name;
        uint256 registeredAt;
        bool active;
    }

    mapping(address => Agent) public agents;
    address[] public agentList;

    event AgentRegistered(address indexed agent, string name);
    event AgentUpdated(address indexed agent, bool active);

    function register(string calldata name) external {
        require(bytes(name).length > 0, "Name required");
        Agent storage a = agents[msg.sender];
        require(a.registeredAt == 0, "Already registered");
        agents[msg.sender] = Agent({
            agentAddress: msg.sender,
            name: name,
            registeredAt: block.timestamp,
            active: true
        });
        agentList.push(msg.sender);
        emit AgentRegistered(msg.sender, name);
    }

    function setActive(bool active) external {
        require(agents[msg.sender].registeredAt > 0, "Not registered");
        agents[msg.sender].active = active;
        emit AgentUpdated(msg.sender, active);
    }

    function getAgent(address a) external view returns (Agent memory) {
        return agents[a];
    }

    function getAgentCount() external view returns (uint256) {
        return agentList.length;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC8004 {
    function registerAgent(bytes32 agentSeed) external returns (uint96 agentId);
    function getAgent(uint96 agentId) external view returns (address agentAddress, uint96 parentId, uint256 registeredAt);
    function resolveIdentity(address identity) external view returns (uint96 agentId);
    event AgentRegistered(uint96 indexed agentId, address indexed agentAddress, bytes32 seed);
}

contract ERC8004IdentityRegistry is IERC8004 {
    uint96 public nextAgentId = 1;
    mapping(uint96 => address) public agents;
    mapping(address => uint96) public identityToAgent;
    mapping(bytes32 => bool) public usedSeeds;

    function registerAgent(bytes32 agentSeed) external returns (uint96 agentId) {
        require(!usedSeeds[agentSeed], "Seed already used");
        require(identityToAgent[msg.sender] == 0, "Already registered");

        usedSeeds[agentSeed] = true;
        agentId = nextAgentId++;
        agents[agentId] = msg.sender;
        identityToAgent[msg.sender] = agentId;

        emit AgentRegistered(agentId, msg.sender, agentSeed);
    }

    function getAgent(uint96 agentId) external view returns (address agentAddress, uint96 parentId, uint256 registeredAt) {
        agentAddress = agents[agentId];
        parentId = 0;
        registeredAt = 0;
    }

    function resolveIdentity(address identity) external view returns (uint96 agentId) {
        agentId = identityToAgent[identity];
        require(agentId != 0, "Identity not registered");
    }
}

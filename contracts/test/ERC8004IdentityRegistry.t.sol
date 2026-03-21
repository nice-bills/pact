// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../../contracts/ERC8004IdentityRegistry.sol";

contract ERC8004IdentityRegistryTest is Test {
    event AgentRegistered(uint96 indexed agentId, address indexed agentAddress, bytes32 seed);

    ERC8004IdentityRegistry public registry;
    address public alice = address(0xABCD);
    address public bob = address(0xDEF0);

    function setUp() public {
        registry = new ERC8004IdentityRegistry();
    }

    function test_registerAgent_assigns_incrementing_agentId() public {
        bytes32 seed = keccak256("alice-seed");
        vm.prank(alice);
        uint96 agentId = registry.registerAgent(seed);
        assertEq(agentId, 1);
        assertEq(registry.nextAgentId(), 2);
    }

    function test_registerAgent_maps_address_to_agentId() public {
        bytes32 seed = keccak256("alice-seed");
        vm.prank(alice);
        registry.registerAgent(seed);
        uint96 resolvedId = registry.resolveIdentity(alice);
        assertEq(resolvedId, 1);
    }

    function test_registerAgent_emits_event() public {
        bytes32 seed = keccak256("alice-seed");
        vm.prank(alice);
        vm.expectEmit();
        emit AgentRegistered(1, alice, seed);
        registry.registerAgent(seed);
    }

    function test_registerAgent_reverts_duplicate_seed() public {
        bytes32 seed = keccak256("shared-seed");
        vm.prank(alice);
        registry.registerAgent(seed);
        vm.prank(bob);
        vm.expectRevert("Seed already used");
        registry.registerAgent(seed);
    }

    function test_registerAgent_reverts_already_registered() public {
        bytes32 seed1 = keccak256("alice-seed-1");
        bytes32 seed2 = keccak256("alice-seed-2");
        vm.prank(alice);
        registry.registerAgent(seed1);
        vm.prank(alice);
        vm.expectRevert("Already registered");
        registry.registerAgent(seed2);
    }

    function test_resolveIdentity_reverts_unregistered() public {
        vm.prank(alice);
        vm.expectRevert("Identity not registered");
        registry.resolveIdentity(alice);
    }

    function test_getAgent_returns_registered_info() public {
        bytes32 seed = keccak256("alice-seed");
        vm.prank(alice);
        registry.registerAgent(seed);
        (address agentAddress, uint96 parentId, uint256 registeredAt) = registry.getAgent(1);
        assertEq(agentAddress, alice);
        assertEq(parentId, 0);
        assertGt(registeredAt, 0);
    }

    function test_multiple_agents_get_incrementing_ids() public {
        bytes32 seedAlice = keccak256("alice-seed");
        bytes32 seedBob = keccak256("bob-seed");
        vm.prank(alice);
        uint96 idAlice = registry.registerAgent(seedAlice);
        vm.prank(bob);
        uint96 idBob = registry.registerAgent(seedBob);
        assertEq(idAlice, 1);
        assertEq(idBob, 2);
        assertEq(registry.nextAgentId(), 3);
    }
}

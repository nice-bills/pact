// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.22;

contract DSTest {
    event log(string);
    event logs(bytes);

    event log_named_uint(string key, uint val);
    event log_named_int(string key, int val);
    event log_named_decimal_int(string key, int val, uint decimals);
    event log_named_decimal_uint(string key, uint val, uint decimals);
    event log_named_string(string key, string val);
    event log_named_address(string key, address val);
    event log_named_bytes32(string key, bytes32 val);
    event log_named_bytes(string key, bytes val);
    event log_named_bool(string key, bool val);

    function assertTrue(bool condition) internal {
        require(condition, "Assertion failed");
    }

    function assertTrue(bool condition, string memory err) internal {
        require(condition, err);
    }

    function fail() internal {
        assertTrue(false);
    }

    function fail(string memory err) internal {
        emit log_named_string("Error", err);
        fail();
    }

    function assertEq(address a, address b) internal {
        if (a != b) {
            emit log_named_address("Error: a != b", b);
            emit log("      Value a is:");
            emit log_named_address("      ", a);
            assertTrue(false);
        }
    }

    function assertEq(bytes32 a, bytes32 b) internal {
        if (a != b) {
            emit log_named_bytes32("Error: a != b", b);
            emit log("      Value a is:");
            emit log_named_bytes32("      ", a);
            assertTrue(false);
        }
    }

    function assertEq(uint a, uint b) internal {
        if (a != b) {
            emit log_named_uint("Error: a != b", b);
            emit log("      Value a is:");
            emit log_named_uint("      ", a);
            assertTrue(false);
        }
    }

    function assertEq(int a, int b) internal {
        if (a != b) {
            emit log_named_int("Error: a != b", b);
            emit log("      Value a is:");
            emit log_named_int("      ", a);
            assertTrue(false);
        }
    }

    function assertEq32(bytes32 a, bytes32 b) internal {
        assertEq(a, b);
    }

    function assertEq(string memory a, string memory b) internal {
        if (keccak256(abi.encodePacked(a)) != keccak256(abi.encodePacked(b))) {
            emit log("Error: strings not equal");
            emit log_named_string("  Expected", b);
            emit log_named_string("    Actual", a);
            assertTrue(false);
        }
    }

    function assertEq0(bytes32 a, bytes32 b) internal {
        assertEq(a, b);
    }

    function assertEq0(bytes32 a, bytes32 b, bytes memory err) internal {
        if (a != b) {
            emit log_named_bytes("Error", err);
            assertEq0(a, b);
        }
    }

    function assertEq0(bytes memory a, bytes memory b) internal {
        if (keccak256(a) != keccak256(b)) {
            emit log("Error: bytes not equal");
            emit log_named_bytes("  Expected", b);
            emit log_named_bytes("    Actual", a);
            assertTrue(false);
        }
    }

    function assertEq0(bytes memory a, bytes memory b, bytes memory err) internal {
        if (keccak256(a) != keccak256(b)) {
            emit log_named_bytes("Error", err);
            assertEq0(a, b);
        }
    }

    function assertGt(uint a, uint b) internal {
        if (!(a > b)) {
            emit log_named_uint("Error: a <= b", b);
            emit log_named_uint("  Value a is:", a);
            assertTrue(false);
        }
    }

    function assertGt(int a, int b) internal {
        if (!(a > b)) {
            emit log_named_int("Error: a <= b", b);
            emit log_named_int("  Value a is:", a);
            assertTrue(false);
        }
    }

    function assertGe(uint a, uint b) internal {
        if (!(a >= b)) {
            emit log_named_uint("Error: a < b", b);
            emit log_named_uint("  Value a is:", a);
            assertTrue(false);
        }
    }

    function assertGe(int a, int b) internal {
        if (!(a >= b)) {
            emit log_named_int("Error: a < b", b);
            emit log_named_int("  Value a is:", a);
            assertTrue(false);
        }
    }

    function assertLt(uint a, uint b) internal {
        if (!(a < b)) {
            emit log_named_uint("Error: a >= b", b);
            emit log_named_uint("  Value a is:", a);
            assertTrue(false);
        }
    }

    function assertLe(uint a, uint b) internal {
        if (!(a <= b)) {
            emit log_named_uint("Error: a > b", b);
            emit log_named_uint("  Value a is:", a);
            assertTrue(false);
        }
    }

    function assertFalse(bool condition) internal {
        require(!condition, "Assertion failed");
    }
}

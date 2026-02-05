// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../lib/forge-std/src/Test.sol";
import "../src/Errores.sol";

contract ErroresTest is Test {
    Errores public err;

    function setUp() public {
        err = new Errores();
    }
    /*
    function testFail() public {
    err.throwError();
    }
    */

    function testRevert() public {
        vm.expectRevert();
        err.throwError();
    }

    function testRequireMessage() public {
        vm.expectRevert(bytes("No Autorizado"));
        err.throwError();
    }

    function testCustomError() public {
        vm.expectRevert(Errores.NoAutorizado.selector);
        err.throwCustomError();
    }

    function testErrorLabel() public {
        assertEq(uint256(1), uint256(1), "Test1");
        assertEq(uint256(1), uint256(1), "Test2");
        assertEq(uint256(1), uint256(1), "Test3");
        assertEq(uint256(1), uint256(1), "Test4");
        assertEq(uint256(1), uint256(1), "Test5");
    }
}

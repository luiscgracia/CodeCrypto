// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../lib/forge-std/src/Test.sol";
import "../src/billetera.sol";

contract billeteraTest is Test {
    billetera public Billetera;

    function setUp() public {
        Billetera = new billetera();
    }

    function testSetOwner() public {
        Billetera.setOwner(address(1));
        assertEq(Billetera.owner(), address(1));
    }
    /*
    function testFailNotOwner() public {
        vm.startPrank(address(1));
        Billetera.setOwner(address(1));
        vm.stopPrank();
    }
    */
}

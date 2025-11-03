// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../lib/forge-std/src/Test.sol";

contract ConsoleTest is Test {
    function testLog() public pure {
        console.log("Log desde prueba");

        int256 x = -1;
        console.log(x);
    }
}

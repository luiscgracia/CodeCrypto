// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "lib/forge-std/src/console.sol";

contract Counter {
    uint256 public number;

    function setNumber(uint256 newNumber) public {
        number = newNumber;
        console.log("Luis Carlos Gracia Puentes");
    }

    function increment() public {
        number++;
    }

    function decrement() public {
        number--;
    }
}

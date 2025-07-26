// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "lib/forge-std/src/console.sol";

contract Errores {
    error NoAutorizado();

    function throwError() external pure {
        require(false, "No Autorizado");
    }

    function throwCustomError() public pure {
        revert NoAutorizado();
    }
}

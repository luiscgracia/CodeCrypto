// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
/*
import "lib/solmate/src/tokens/ERC20.sol";

contract Token is ERC20("CoinTest", "CTE", 18) {
}
*/

import "node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract TestOwnable is Ownable {
    constructor() Ownable(msg.sender) {}
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract RandomnessVulnerable {
    uint256 private seed;
    uint256 public randomNumber;

    constructor() {
        seed = block.timestamp;
    }

    function generateRandomNumber() public {
        randomNumber = uint256(keccak256(abi.encode(block.difficulty, block.timestamp, seed)));
    }
}

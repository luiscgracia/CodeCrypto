// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface RandomnessOracle {
    function getRandomNumber() external returns (uint256);
}

contract RandomnessOptimizado {
    uint256 public randomNumber;
    address private oracle;

    constructor(address _oracleAddress) {
        oracle = _oracleAddress;
    }

    function generateRandomNumber() public {
        require(oracle != address(0), "Oracle address not set");
        randomNumber = RandomnessOracle(oracle).getRandomNumber();
    }
}

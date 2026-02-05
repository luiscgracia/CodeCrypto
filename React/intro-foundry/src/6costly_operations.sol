// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract CostlyOperationsVulnerable {
    uint256 public constant MAX_ITERATIONS = 1600;

    function performCostlyOperation() external pure returns (uint256 result) {
        result = 0;

        for (uint256 i = 0; i < MAX_ITERATIONS; i++) {
            result += 1;
        }
    }
}

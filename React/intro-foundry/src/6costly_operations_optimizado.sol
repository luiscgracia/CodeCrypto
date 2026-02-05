// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract CostlyOperationsOptimizado {
    uint256 public constant MAX_ITERATIONS = 1600;

    function performCostlyOperation() external pure returns (uint256 result) {
        result = sumNumbers(MAX_ITERATIONS);

        // SE CAMBIA ESTA PARTE POR LA SIGUIENTE FUNCTION
        // for (uint256 i = 0; i < MAX_ITERATIONS; i++) {
        //   result += 1;
        // }
    }

    function sumNumbers(uint256 n) internal pure returns (uint256) {
        return (n * (n + 1)) / 2;
    }
}

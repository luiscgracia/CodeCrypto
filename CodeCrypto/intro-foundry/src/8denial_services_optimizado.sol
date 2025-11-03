// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract DenialServiceOptimizado {
    uint256 constant MAX_ITERATIONS = 100;

    function performDos(uint256 _iterations) public pure {
        require(_iterations <= MAX_ITERATIONS, "Excedio el numero de iteraciones");
        for (uint256 i = 0; i <= _iterations; i++) {
            uint256[] memory data = new uint256[](_iterations);
            for (uint256 j = 0; j <= _iterations; j++) {
                data[j] = j;
            }
        }
    }
}

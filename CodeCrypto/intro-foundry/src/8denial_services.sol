// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract DenialServiceVulnerable {
    function performDos(uint256 _iterations) public pure {
        for (uint256 i = 0; i <= _iterations; i++) {
            uint256[] memory data = new uint256[](_iterations);

            for (uint256 j = 0; j <= _iterations; j++) {
                data[j] = j;
            }
        }
    }
}

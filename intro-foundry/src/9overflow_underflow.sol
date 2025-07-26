// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract OverflowUnderflowExample {
    function overflowExample(uint8 _val) public pure returns (uint8) {
        uint8 maxValue = 255;
        maxValue += _val;
        return maxValue;
    }

    function underlowExample(uint8 _val) public pure returns (uint8) {
        uint8 minValue = 0;
        minValue -= _val;
        return minValue;
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./SafeMath.sol";

contract OverflowUnderflowOptimizado {
    using SafeMath for uint256;

    function overflowExample(uint8 _val) public pure returns (uint8) {
        uint256 maxValue = 255;
        maxValue = maxValue.add(uint256(_val));
        return uint8(maxValue);
    }

    function underflowExample(uint8 _val) public pure returns (uint8) {
        uint256 minValue = 0;
        minValue = minValue.sub(uint256(_val));
        return uint8(minValue);
    }
}

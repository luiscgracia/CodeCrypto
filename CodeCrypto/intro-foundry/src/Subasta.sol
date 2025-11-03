// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Subasta {
    uint256 public inicio = block.timestamp + 1 days;
    uint256 public fin = block.timestamp + 2 days;

    function oferta() external view {
        require(block.timestamp >= inicio && block.timestamp < fin, "No puede ofertar");
    }

    function finalizar() external view {
        require(block.timestamp >= fin, "No puede finalizar");
    }
}

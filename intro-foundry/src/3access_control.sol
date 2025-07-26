// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract VulnerableAccessControl {
    uint256 private secretNumber;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function setSecretNumber(uint256 _newNumber) public {
        secretNumber = _newNumber;
    }

    function getSecretNumber() public view returns (uint256) {
        return secretNumber;
    }

    function getOwner() public view returns (address) {
        return owner;
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract SecureAccessControl {
    uint256 private secretNumber;
    address private owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function setSecretNumber(uint256 _newNumber) public onlyOwner {
        secretNumber = _newNumber;
    }

    function getSecretNumber() public view returns (uint256) {
        return secretNumber;
    }

    function getOwner() public view returns (address) {
        return owner;
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract VulnerableReentrancy {
    mapping(address => uint256) private balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 _amount) public {
        require(_amount <= balances[msg.sender], "Insufficient balance");

        // Vulnerabilidad
        (bool success,) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer failed");

        balances[msg.sender] -= _amount;
    }
}

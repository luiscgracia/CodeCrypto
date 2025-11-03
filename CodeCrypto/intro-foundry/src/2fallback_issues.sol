// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract VulnerableFallback {
    mapping(address => uint256) private balances;

    fallback() external payable {
        balances[msg.sender] += msg.value;
        (bool success,) = msg.sender.call{value: msg.value}("");
        require(success, "Transferencia fallida");
    }

    function withdraw(uint256 amount) external {
        uint256 balance = balances[msg.sender];
        require(balance >= amount, "Saldo insuficiente");
        balances[msg.sender] = balance - amount;
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Transferencia fallida");
    }

    receive() external payable {}
}

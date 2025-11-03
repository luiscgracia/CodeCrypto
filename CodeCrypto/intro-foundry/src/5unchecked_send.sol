// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract uncheckedSend {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Saldo insuficiente");

        // Vulnerabilidad
        payable(msg.sender).send(_amount);

        // Solucion
        require(payable(msg.sender).send(_amount), "Fallo el envio");
    }
}

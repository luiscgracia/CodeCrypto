// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract VulnerableRaceCondition {
    uint256 public balance;
    mapping(address => uint256) public balances;

    function depositar() public payable {
        balances[msg.sender] += msg.value;
        balance += msg.value;
    }

    function retirar(uint256 _cantidad) public {
        require(balances[msg.sender] >= _cantidad, "Saldo insuficiente");

        uint256 saldoAnterior = balances[msg.sender];

        balances[msg.sender] -= _cantidad;

        require(payable(msg.sender).send(_cantidad), "Error al realizar la transferencia");

        require(balances[msg.sender] == saldoAnterior, "Race condition detectada");
    }
}

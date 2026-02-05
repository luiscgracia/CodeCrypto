// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract OptimizadoRaceCondition {
    uint256 public balance;
    mapping(address => uint256) public balances;
    mapping(address => bool) public isTransfering;

    function depositar() public payable {
        balances[msg.sender] += msg.value;
        balance += msg.value;
    }

    function retirar(uint256 _cantidad) public {
        require(balances[msg.sender] >= _cantidad, "Saldo insuficiente");
        require(!isTransfering[msg.sender], "La transferencia ya esta en curso");
        isTransfering[msg.sender] = true;
        require(payable(msg.sender).send(_cantidad), "Error al realizar la transferencia");
        balances[msg.sender] -= _cantidad;
        isTransfering[msg.sender] = false;
    }
}

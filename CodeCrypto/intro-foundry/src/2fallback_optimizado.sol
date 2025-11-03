// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract OptimizadoFallback {
    mapping(address => uint256) private balances;

    fallback() external payable {
        revert("Esta funci&oacute;n no est&aacute; habilitada para recibir pagos");
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() public {
        uint256 amount = balances[msg.sender]; // 1000
        require(amount > 0, "Saldo insuficiente");
        balances[msg.sender] = 0; // 0
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Transferencia fallida");
    }

    receive() external payable {}
}

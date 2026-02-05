// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract SendEther {
    address payable public owner;

    event Deposit(address account, uint256 amount);

    constructor() payable {
        owner = payable(msg.sender);
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function retirar(uint256 _cantidad) external {
        require(msg.sender == owner, "Usted no es el propietario");
        payable(msg.sender).transfer(_cantidad);
    }

    function setOwner(address _owner) external {
        require(msg.sender == owner, "Usted no es el propietario");
        owner = payable(_owner);
    }
}

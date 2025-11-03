// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "lib/forge-std/src/console.sol";

contract billetera {
    address payable public owner;

    constructor() payable {
        owner = payable(msg.sender);
    }

    receive() external payable {}

    function retirar(uint256 cantidad) external {
        require(msg.sender == owner, "Usted no es el propietario");
        payable(msg.sender).transfer(cantidad);
    }

    function setOwner(address _owner) external {
        require(msg.sender == owner, "Usted no es el propietario");
        owner = payable(_owner);
    }
}

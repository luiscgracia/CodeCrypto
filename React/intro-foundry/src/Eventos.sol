// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Eventos {
    event Transfer(address indexed _from, address indexed _to, uint256 _amount);

    function transfer(address _from, address _to, uint256 _amount) public {
        emit Transfer(_from, _to, _amount);
    }

    function transferMany(address _from, address[] calldata _to, uint256[] calldata _amount) public {
        for (uint256 i = 0; i < _to.length; i++) {
            emit Transfer(_from, _to[i], _amount[i]);
        }
    }
}

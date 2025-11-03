// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract SafeReentrancy {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");

        require(payable(msg.sender).send(_amount), "Transfer failed");
        balances[msg.sender] -= _amount;
    }

    function getBalance(address _address) public view returns (uint256) {
        return balances[_address];
    }
}

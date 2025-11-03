// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract OraculoCodeCrypto {
  address owner;
  uint public numeroMeteoritos;

  event __calbackNewData();

  modifier onlyOwner() {
    require(msg.sender == owner, 'Only owner');
    _;
  }

  constructor() {
    owner = msg.sender;
  }

  function update() public onlyOwner {
    emit __calbackNewData();
  }

  function setNnumeroMeteoritos(uint _num) public onlyOwner {
    numeroMeteoritos = _num;
  }
}
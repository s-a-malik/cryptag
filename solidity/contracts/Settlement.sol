//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Settlement {
  address private owner;
  address private settler = 0x4ca5e9214C15b303550B1E6f5e3Eae8033725637;

  constructor() {
    // TODO
    owner = msg.sender;
  }

  function getBalance() public view returns (uint) {
    return address(this).balance;
  }

  // receive funds
  event Receive(address indexed, uint indexed);
  receive() external payable {
    emit Receive(msg.sender, msg.value);
  }

  event Deposit(address indexed, uint indexed);
  function deposit() external payable {
    emit Deposit(msg.sender, msg.value);
  }

  event Disperse(address indexed, uint indexed);
  function disperse(address payable _to, uint _value) public {
    require(msg.sender == settler && address(this).balance >= _value, 'Only the owner can dispatch funds and the balance must be greater than the dispersed amount');
    (bool sent,) = _to.call{value: _value}(""); // msg.value appears broken
    require(sent, 'Failed to send');
    emit Disperse(_to, _value);
  }

}
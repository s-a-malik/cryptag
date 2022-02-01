//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Task {
  address public settlement; // settlement contract
  address private owner;

  constructor(address _settlement) {
    // TODO
    owner = msg.sender;
    settlement = _settlement;
  }

  // let anyone stake the task
  event Receive(address indexed, uint indexed);
  receive() external payable {
    emit Receive(msg.sender, msg.value);
  }

  event Deposit(address indexed, uint indexed);
  function deposit() external payable {
    emit Deposit(msg.sender, msg.value);
  }

  event Settle(uint);
  function settle() public {
    // TODO
    uint _amount = address(this).balance;
    require(msg.sender == owner, 'Only the owner can settle tasks');
    (bool sent,) = settlement.call{value: address(this).balance}("");
    require(sent, 'Failed to settle funds');
    emit Settle(_amount); // or address(this).balance
  }
}

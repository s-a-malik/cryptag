//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Task {
  address private sister; // settlement contract
  address private owner;
  uint private funds;

  constructor(address _sister) {
    // TODO
    owner = msg.sender;
    sister = _sister;
  }

  // let anyone stake the task
  event Receive(address indexed, uint indexed);
  receive() external payable {
    funds += msg.value;
    emit Receive(msg.sender, msg.value);
  }

  event Deposit(address indexed, uint indexed);
  function deposit() external payable {
    funds += msg.value;
    emit Deposit(msg.sender, msg.value);
  }

  event Settle(uint);
  function settle() public {
    // TODO
    require(msg.sender == owner, 'Only the owner can settle tasks');
    (bool sent,) = sister.call{value: funds}("");
    require(sent, 'Failed to settle funds');
    emit Settle(funds); // or address(this).balance
  }
}

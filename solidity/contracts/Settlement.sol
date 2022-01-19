//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Settlement {
  address private owner;

  constructor() {
    // TODO
    owner = msg.sender;
  }

  // receive funds
  receive() external payable {}
  function deposit() external payable {}

  function disperse(address payable _to, uint _value) public {
    require(msg.sender == owner, 'Only the owner can dispatch funds');
    (bool sent,) = _to.call{value: _value}(""); // msg.value appears broken
    require(sent, 'Failed to send');
  }

}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// pragma abicoder v2;

contract Donor {
    uint256 id;
    address owner;

    constructor(uint256 userId, address userOwner) {
        id = userId;
        owner = userOwner;
    }

    function vote(address subAccount) public {
    }
}
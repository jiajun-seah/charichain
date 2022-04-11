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

    function donate(address charity) public payable {
        uint256 amtDonated = msg.value;
        address payable charityAddress = payable(charity);
        charityAddress.transfer(amtDonated);
    }

    function vote(address subAccount) public {
        
    }
}
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
// pragma abicoder v2;
import "./Charity.sol";
import "./ChariToken.sol";

contract Donor {
    Charity charityContract;
    ChariToken chariTokenContract;
    uint256 id;
    address _owner = msg.sender;

    constructor(uint256 userId, Charity charityAddress, ChariToken chariTokenAddress) {
        id = userId;
        charityContract = charityAddress;
        chariTokenContract = chariTokenAddress;
    }

    modifier ownerOnly() {
        require(msg.sender == _owner);
        _;
    }


    function donate(address charity) public payable {
        uint256 amtDonated = msg.value;
        address payable charityAddress = payable(charity);
        charityAddress.transfer(amtDonated);

        charityContract.processDonations(amtDonated, address(this));
    }

    function vote(address subAccount, uint256 voteAmt) public payable ownerOnly {
        uint256 tokenBalance = chariTokenContract.checkCredit();
        require(tokenBalance > 0, "You don't have any ChariTokens to vote");
        chariTokenContract.getErc20Contract().transfer(subAccount, voteAmt); 
    }
}
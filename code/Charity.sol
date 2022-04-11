// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "./ChariToken.sol";

contract Charity {
    ChariToken tokenContract;
    address[] public subAccounts;
    uint8 public numberOfSubAccounts; //subaccounts sld not exceed 255
    mapping(address => uint8) public subAccountPercentages; // mapping of proportion of amount donated, for each sub-account [0.1, 0.2, 0.3, 0.4] etc
    mapping(address => bytes32) public subAccountNames; // same size as mapping above, stores the name of each subaccount for that charity
    mapping(address => uint256) public subAccountVotes; //same size as mapping above, tracks num. of votes per subaccount for that charity
    mapping(address => uint256) public amountDonated; // mapping for amount that each person donates


    constructor(address[] memory accounts) {
        ChariToken ct = new ChariToken();
        tokenContract = ct;
        subAccounts = accounts;
        numberOfSubAccounts = 0;
    }

    event Allocation(address accountAddress, uint8 percentages);

    // Function to receive Ether. msg.data must be empty
    receive() external payable {} // might need to change imo.... because we need to store senders

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

    // creation of sub-accounts for a single charity
    function createSubAccount(address accountAddress, bytes32 accountName) public {
        address temp;
        for(uint i = 0; i < subAccounts.length; i++) {
            if (subAccounts[i] == accountAddress) {
                temp = accountAddress;
            }
        }
        require(temp != accountAddress, "This account has already been created");
        subAccounts.push(accountAddress);
        subAccountPercentages[accountAddress] = 0;
        subAccountNames[accountAddress] = accountName;
        numberOfSubAccounts += 1;
    }

    // allocate percentages based on sub-account addresses. Feed in array of percentages
    function allocatePercentages(uint8[] memory percentages) public{
        require(percentages.length == subAccounts.length, "Length of input differs from number of sub-accounts");
        uint temp;
        for(uint i = 0; i < percentages.length; i++) {
            temp += percentages[i];
        }
        require(temp == 100, "Your percentages does not add up to 100");
        for(uint i = 0; i < percentages.length; i++) {
            subAccountPercentages[subAccounts[i]] = percentages[i];
        }
    }

    // allocate donations based on balance.. do we need to change? to allocate each time someone donates
    function allocateDonations(uint256 amtDonated) public payable {
        // uint256 amtDonated = getBalance();
        for (uint i =0; i < numberOfSubAccounts; i++) {
            address subAccountAdd = subAccounts[i]; // subaccount in question currently
            uint8 ratio = subAccountPercentages[subAccountAdd];
            address payable subAccountAddPayable = payable(subAccountAdd);
            subAccountAddPayable.transfer((ratio/100)*amtDonated);
        }
    }

    //process donations: split donations and award donor with tokens
    function processDonations(uint256 amtDonated, address donor) public payable {
        this.allocateDonations(amtDonated); //allocate donations

        //mint tokens to this contract, then send it to donor
        tokenContract.getCredit(amtDonated);
        uint256 tokensToAward = tokenContract.convertToCredits(amtDonated);
        tokenContract.getErc20Contract().transfer(donor, tokensToAward); 
    }


/* GETTERS */

     // getter for allocation
    function showAllocation() public {
        for(uint i = 0; i < subAccounts.length; i++) {
            address tempAddress = subAccounts[i];
            uint8 tempAllocation = subAccountPercentages[tempAddress];
            emit Allocation(tempAddress, tempAllocation);
        }
    }

    // a general check on how much money the person has put, and how it has been spread
    function getProportions() public view returns (uint[] memory xd) {
        uint[] memory listOfProportions = new uint[](getNumberOfAccounts());
        for (uint256 i = 0; i < getNumberOfAccounts(); i++) {
            listOfProportions[i] = subAccountPercentages[subAccounts[i]] * amountDonated[msg.sender]; // "Food, 100" e.g.
        }
        return listOfProportions; // e.g. [100, 200, 300]
    }
    
   
    
    function getAccountsInOrder() public view returns (bytes32[] memory xd) {
        bytes32[] memory listOfAccounts = new bytes32[](getNumberOfAccounts());
        for (uint256 i = 0; i < getNumberOfAccounts(); i++) {
            listOfAccounts[i] = (subAccountNames[subAccounts[i]]); // "Food, 100" e.g.
        }
        return listOfAccounts; // e.g. ["Food", "Water", "Air"]. combine with getProportions() to find out amount of money in each sub wallet
    }


    // given an amount, how much is going to which acc? a way for donors to check where amounts are gg before they donate. 
    //combine with getAccountsInOrder() as well, to find out where in which account
    function checkAmount(uint256 amt) public view returns (uint[] memory xd) {
        uint[] memory listOfAmounts = new uint[](getNumberOfAccounts());
        for (uint256 i = 0; i < getNumberOfAccounts(); i++) {
            listOfAmounts[i] = (subAccountPercentages[subAccounts[i]] * amt);
        }
        return listOfAmounts;
    }

    function getNumberOfAccounts() public view returns (uint256) {
        return numberOfSubAccounts;
    }

    // fall back function balance!
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
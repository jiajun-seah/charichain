// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
pragma abicoder v2;

// import "./ChariToken.sol";
import './ERC20.sol';
import "./Campaign.sol";

contract Charity {
    // ChariToken tokenContract;
    Campaign campaignContract;
    address[] public subAccounts;
    address _owner = msg.sender;
    uint8 public numberOfSubAccounts; //subaccounts sld not exceed 255
    mapping(address => uint8) public subAccountPercentages; // mapping of proportion of amount donated, for each sub-account [0.1, 0.2, 0.3, 0.4] etc
    mapping(address => bytes32) public subAccountNames; // same size as mapping above, stores the name of each subaccount for that charity
    // mapping(address => uint256) public subAccountVotes; //same size as mapping above, tracks num. of votes per subaccount for that charity
    mapping(address => uint256) public amountDonated; // mapping for amount that each person donates

    //Token integration
    ERC20 erc20instance;

    constructor() {
        erc20instance = new ERC20();
        numberOfSubAccounts = 0;
    }

    event Allocation(address accountAddress, uint8 percentages);

    event Transfer(address to, uint256 amount); //event of Charity sending CT to donor
    event GetCT(address to, uint256 amount); //event of this contract getting CT with Eth
    event TransferViaVote(address to, uint256 amount); //event of Donor voting to sub account
    // event TokenSent(address sender, uint256 amt); //event of Charity sending CT to donor
    event Voted(address candidate); //event of voting for a sub-account
    
    modifier ownerOnly() {
        require(msg.sender == _owner);
        _;
    }
    // Function to receive Ether. msg.data must be empty
    // receive() external payable {} // might need to change imo.... because we need to store senders

    // // Fallback function is called when msg.data is not empty
    // fallback() external payable {}
    
    // creation of sub-accounts for a single charity
    function createSubAccount(address accountAddress, bytes32 accountName) public ownerOnly{
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
    function allocatePercentages(uint8[] memory percentages) public ownerOnly() {
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

    //token integration
    function getCT(uint256 amt) public payable ownerOnly { //an address gets CT with Eth
        require(amt >= 1E16, "At least 0.01ETH needed to get CT");
        uint256 val = amt/ 1E16;
        erc20instance.mint(msg.sender, val);
        emit GetCT(msg.sender, val);
    }

    function transferCT(address to, uint256 amount) private { //transfer PT from Pool contract to an address, will be called within the contract when voting ends to transfer the PT in the pool to the winner or return the PT
        erc20instance.transfer(to, amount);
        emit Transfer(to, amount);
    }

    function transferCTViaVote(address from, address to, uint256 amount) private { //transfer PT from Pool contract to an address, will be called within the contract when voting ends to transfer the PT in the pool to the winner or return the PT
        erc20instance.transferFrom(from, to, amount);
        emit TransferViaVote(to, amount);
    }

    function donate() public payable {
        address donor = msg.sender;
        uint256 amtDonated = msg.value;
        // address payable charityAddress = address(this);
        // charityAddress.transfer(amtDonated);

        allocateDonations(amtDonated); //allocate donations

        //mint tokens to this contract, then send it to donor
        getCT(amtDonated);
        uint256 tokensToAward = this.convertToCredits(amtDonated);
        transferCT(donor, tokensToAward); 
    }

    function vote(address subAccount, uint256 voteAmt) public payable {
        address donor = msg.sender;
        uint256 tokenBalance = this.checkCTBalance(donor);
        require(tokenBalance > 0, "You don't have any ChariTokens to vote");
        transferCTViaVote(donor, subAccount, voteAmt); 
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



    //this is a unit conversion function that converts amount of ether into DTs
    function convertToCredits(uint256 etherAmount) public pure returns(uint256) {
        return(etherAmount / 10000000000000000);
    }

    function checkCTBalance(address user) public view returns(uint256) {
        return erc20instance.balanceOf(user);
    }


    //process donations: split donations and award donor with tokens
    // function processDonations(uint256 amtDonated, address donor) public payable {
    //     this.allocateDonations(amtDonated); //allocate donations

    //     //mint tokens to this contract, then send it to donor
    //     tokenContract.getCredit(amtDonated);
    //     uint256 tokensToAward = tokenContract.convertToCredits(amtDonated);
    //     tokenContract.getErc20Contract().transfer(donor, tokensToAward); 
    // }


    function createCampaign(bytes32 campaignName) public ownerOnly() {
        uint8[] memory percentages = new uint8[](getNumberOfAccounts());
        bytes32[] memory names = new bytes32[](getNumberOfAccounts());
        for (uint i = 0; i < getNumberOfAccounts(); i++) {
            percentages[i] = subAccountPercentages[subAccounts[i]];
            names[i] = subAccountNames[subAccounts[i]];
        }
        uint8 campaignType = 2;
        Campaign c = new Campaign(subAccounts, numberOfSubAccounts, percentages, names, campaignType, campaignName);
        campaignContract = c;
    }

/* Campaign section */

    function addCampaignGoals(uint256[] memory allocations) public{
        campaignContract.addCampaignGoals(allocations);
    }

    function startCampaign(uint8 typeOfCampaign) public {
        campaignContract.startCampaign(typeOfCampaign);
    }

    function depositCampaign(bytes32 subAccount) public payable {
        campaignContract.depositCampaign(subAccount);
    }

    function withdrawCampaign(bytes32 subAccount) public {
        campaignContract.withdrawCampaign(subAccount);
    }


/* GETTERS */
    //Add relevant getters and setters
    function getContractOwner() public view returns(address){
        return _owner;
    }


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

    function getSubAccountBalance(bytes32 subAccountName) public view returns(uint256) {
        return campaignContract.getSubAccountBalance(subAccountName);
    }

     function getCampaignType() public view returns (uint8) {
         return campaignContract.getCampaignType();
     }

    function checkVoteOutcome() public payable returns(uint256[] memory vc) {
        uint256[] memory voteCounts = new uint256[](getNumberOfAccounts());
        for (uint256 i = 0; i < getNumberOfAccounts(); i++) {
            uint256 currVoteCount = checkCTBalance(subAccounts[i]);
            voteCounts[i] = currVoteCount;

            //reset voteCount
            erc20instance.transferFrom(subAccounts[i], address(this), currVoteCount); //simulate burn tokens by transferring from subaccount to charity

        }

        return voteCounts;        
    }
}
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
pragma abicoder v2;

// import "./ChariToken.sol";
import './ERC20.sol';

contract Charity {
    // ChariToken tokenContract;
    //Campaign campaignContract;
    address[] public subAccounts;
    address _owner = msg.sender;
    uint8 public numberOfSubAccounts; //subaccounts sld not exceed 255
    mapping(address => uint8) public subAccountPercentages; // mapping of proportion of amount donated, for each sub-account [10, 20, 30, 40] etc
    mapping(address => bytes32) public subAccountNames; // same size as mapping above, stores the name of each subaccount for that charity
    mapping(address => uint256) public subAccountVotes; //same size as mapping above, tracks num. of votes per subaccount for that charity
    mapping(address => uint256) public amountDonated; // mapping for amount that each person donates

    // campaign vars
    mapping(address => uint256) subAccountBalance; // Maps addreess of account => account balance. Can switch to address => balance mapping if that is used more (one less conversion step).
    mapping(address => uint256) campaignGoals; // Maps account => goal for that account.
    mapping(address => Stages) campaignAccountStatus; // Maps address to current stage.
    mapping(address => mapping(address => uint256)) donorsBalance; // how much each donor has donated
    mapping(address => mapping(address => bool)) hasDonated;
    mapping(address => address[]) donorList;
    //address[] public donorList;
    uint8 campaignStatus; // 0 for split if not met, 1 for return to donors if not met, 2 for not started yet, 3 for done already.
    uint8 campaignType;
    bytes32 campaignName;

    uint public creationTime;
    enum Stages {
        AcceptingDeposits,
        ReleasingDeposits,
        ElapsedDeposits
    }

    //Token integration
    ERC20 erc20instance;

    constructor() {
        erc20instance = new ERC20();
        numberOfSubAccounts = 0;
        campaignStatus = 3;
    }

    event Allocation(address accountAddress, uint8 percentages);

    event Transfer(address to, uint256 amount); //event of Charity sending CT to donor
    event GetCT(address to, uint256 amount); //event of this contract getting CT with Eth
    event TransferViaVote(address to, uint256 amount); //event of Donor voting to sub account
    // event TokenSent(address sender, uint256 amt); //event of Charity sending CT to donor
    event Donated(address mainAccount); //event of voting for a sub-account
    event Voted(address subaccount); //event of voting for a sub-account
    event EndVote(address sender, uint256 currVoteCount); //event of ending a vote process
    event Tally(address subAccount, uint256 voteCounts);
    event TotalTally(uint256[] voteCountsList);
    // event Amount(uint256 amt);
    
    // campaign events
    event accountGoalHit(address account, uint256 balance, bytes32 accountName);
    event accountGoalNotHit(address account, uint256 balance, bytes32 accountName);
    event createdCampaign(bytes32 nameOfCampaign);
    event ReleasingDepositsTransfer(uint256 amountTransferred, address account);
    event elapsedDepositsTransfer(uint256[] splitArray);
    modifier ownerOnly() {
        require(msg.sender == _owner, "This method requires the owner to instantiate it!");
        _;
    }

    modifier timedTransitions() {
        for (uint i = 0; i < numberOfSubAccounts; i++) {
            if (campaignAccountStatus[subAccounts[i]] == Stages.AcceptingDeposits && block.timestamp >= creationTime + 7 days) {
                campaignAccountStatus[subAccounts[i]] = Stages.ElapsedDeposits;
                // *withdrawn for demo purposes  withdrawCampaign(subAccountNames[subAccounts[i]]);
                emit accountGoalNotHit(subAccounts[i], subAccountBalance[subAccounts[i]], subAccountNames[subAccounts[i]]);
                campaignStatus = 3;
            }
        }
        _;
    }
    // Function to receive Ether. msg.data must be empty
    receive() external payable {} // might need to change imo.... because we need to store senders

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}
    
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
        require(campaignStatus != 0 && campaignStatus != 1, "Cannot change sub-account percentages during campaign!"); // cannot change percentages when campaign is running.
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
    function getCT(uint256 amt) public payable { //an address gets CT with Eth
        require(amt >= 1E16, "At least 0.01ETH needed to get CT");
        uint256 val = amt/ 1E16;
        erc20instance.mint(msg.sender, val);
        emit GetCT(msg.sender, val);
    }

    // function transferCT(address to, uint256 amount) public {
    //     erc20instance.transfer(to, amount);
    //     emit Transfer(to, amount);
    // }

    function transferCTViaVote(address to, uint256 amount) public { //called by donor
        // erc20instance.approve(address(this), amount);
        // erc20instance.approve(from, amount);
        erc20instance.transfer(to, amount);
        emit TransferViaVote(to, amount);
    }

    function donate() public payable {
        uint256 amtDonated = msg.value;

        //allocate donations
        allocateDonations(amtDonated); 

        //mint tokens to donor
        getCT(amtDonated);

        emit Donated(address(this));
    }

    function vote(address subAccount, uint256 voteAmt) public payable { //called by donor
        address donor = msg.sender;
        uint256 tokenBalance = this.checkCTBalance(donor);
        require(tokenBalance > voteAmt, "You don't have enough ChariTokens to vote");
        
        transferCTViaVote(subAccount, voteAmt); 
        emit Voted(subAccount);
    }

    // allocate donations based on balance.
    function allocateDonations(uint256 amtDonated) public payable {
        // uint256 amtDonated = getBalance();
        for (uint i =0; i < numberOfSubAccounts; i++) {
            address subAccountAdd = subAccounts[i]; // subaccount in question currently
            uint8 ratio = subAccountPercentages[subAccountAdd];
            address payable subAccountAddPayable = payable(subAccountAdd);
            subAccountAddPayable.transfer(ratio * amtDonated / 100);
            
            // emit Amount(subAccountAddPayable.balance);
        }
    }

    //this is a unit conversion function that converts amount of ether into DTs
    function convertToCredits(uint256 etherAmount) public pure returns(uint256) {
        return(etherAmount / 10000000000000000);
    }

    function checkCTBalance(address user) public view returns(uint256) {
        return erc20instance.balanceOf(user);
    }

    function createCampaign(bytes32 nameOfCampaign) public ownerOnly {
        require(campaignStatus == 3, "There is another campaign still running.");
        campaignStatus = 2; // created but not running.
        campaignName = nameOfCampaign;
        emit createdCampaign(nameOfCampaign);
    }

/* Campaign section */

    function addCampaignGoals(uint256[] memory allocations) public ownerOnly {
        require(allocations.length == numberOfSubAccounts, "You need to create a goal for each sub-account!");
        require(campaignStatus == 2, "The campaign has not been created or has already started!");
        for (uint i = 0; i < numberOfSubAccounts; i++) {
            campaignGoals[subAccounts[i]] = allocations[i]; // allocate
        }
    }

    function startCampaign(uint8 typeOfCampaign) public ownerOnly {
        for (uint i = 0; i < numberOfSubAccounts; i++) {
            campaignAccountStatus[subAccounts[i]] = Stages.AcceptingDeposits;
        }
        creationTime = block.timestamp; // start timer
        campaignType = typeOfCampaign;
        campaignStatus = typeOfCampaign;
    }

    function depositCampaign(bytes32 subAccount) public payable timedTransitions {
        address temp;
        for (uint i = 0; i < numberOfSubAccounts; i++) {
            if (subAccountNames[subAccounts[i]] == subAccount) {
                temp = subAccounts[i]; // finding account address using string, since that is fed
            }
        }
        require(campaignAccountStatus[temp] == Stages.AcceptingDeposits, "The campaign has either finished or has been fulfilled.");
        uint256 existingBalance = subAccountBalance[temp]; // update sub account
        if (existingBalance != 0) {
            existingBalance += msg.value;
        } else {
            existingBalance = msg.value;
        }
        subAccountBalance[temp] = existingBalance;
        if (existingBalance >= campaignGoals[temp]) {
            campaignAccountStatus[temp] = Stages.ReleasingDeposits; // met the criteria already. release now? or wait for cue
            emit accountGoalHit(temp, existingBalance, subAccount);
        }
        if (hasDonated[temp][msg.sender] != true) {
            hasDonated[temp][msg.sender] = true;
            donorList[temp].push(msg.sender); // add to address list
        }
        uint256 donorBalance = donorsBalance[temp][msg.sender]; // update amount donated
        if (donorBalance != 0) {
            donorBalance += msg.value;
        } else {
            donorBalance = msg.value;
        }
        donorsBalance[temp][msg.sender] = donorBalance;
    }

    function withdrawCampaign(bytes32 subAccount) public timedTransitions ownerOnly { // if charity wants to withdraw
        address temp;
        for (uint i = 0; i < numberOfSubAccounts; i++) {
            if (subAccountNames[subAccounts[i]] == subAccount) {
                temp = subAccounts[i]; // finding account address using bytes32, since that is fed
            }
        }
        require(campaignAccountStatus[temp] != Stages.AcceptingDeposits, "The sub-account has not hit its target, and the time has not elapsed yet.");
        if (campaignAccountStatus[temp] == Stages.ReleasingDeposits) {
            uint256 amount = subAccountBalance[temp];
            address payable accountPayable = payable(temp);
            accountPayable.transfer(amount); // transfer is done if target is hit AND the charity rq's for transfer
            subAccountBalance[temp] = 0;
            address[] memory addressList = donorList[temp];
            for (uint i = 0; i < addressList.length; i++) {
                address currentDonor = addressList[i];
                donorsBalance[temp][currentDonor] = 0;
                hasDonated[temp][currentDonor] = false;
            }
            delete donorList[temp];
            emit ReleasingDepositsTransfer(amount, temp);
        } else if (campaignAccountStatus[temp] == Stages.ElapsedDeposits) { // its over without hitting the target.
            uint256 amount = subAccountBalance[temp];
            if (amount != 0) {
                // two situations: split OR return to donors
                if (campaignType == 0) {
                    uint256 amtDonated = subAccountBalance[temp];
                    uint256[] memory splitArray = new uint256[](getNumberOfAccounts());
                    for (uint j =0; j < numberOfSubAccounts; j++) {
                        address subAccountAdd = subAccounts[j];
                        uint8 ratio = subAccountPercentages[subAccountAdd];
                        address payable subAccountAddPayable = payable(subAccountAdd);
                        subAccountAddPayable.transfer((ratio * amtDonated / 100));
                        splitArray[j] = (ratio * amtDonated / 100) ;
                    }
                    subAccountBalance[temp] = 0;
                    address[] memory addressList = donorList[temp];
                    for (uint i = 0; i < addressList.length; i++) {
                        address currentDonor = addressList[i];
                        donorsBalance[temp][currentDonor] = 0;
                        hasDonated[temp][currentDonor] = false;
                    }
                    delete donorList[temp];
                    emit elapsedDepositsTransfer(splitArray);
                } else if (campaignType == 1) { // return to donors.
                    uint256[] memory splitArray = new uint256[](getDonorListLength(temp));
                    for (uint k = 0; k < donorList[temp].length; k++) {
                        uint256 amtToReturn = donorsBalance[temp][donorList[temp][k]];
                        address payable accountPayable = payable(donorList[temp][k]);
                        accountPayable.transfer(amtToReturn);
                        splitArray[k] = amtToReturn;
                    }
                    subAccountBalance[temp] = 0;
                    address[] memory addressList = donorList[temp];
                    for (uint i = 0; i < addressList.length; i++) {
                        address currentDonor = addressList[i];
                        donorsBalance[temp][currentDonor] = 0;
                        hasDonated[temp][currentDonor] = false;
                    }
                    delete donorList[temp];
                    emit elapsedDepositsTransfer(splitArray);
                }
            }
        } 
    }
    // function purely for demo purposes!

    function fastForwardCampaignStates() public {
        for (uint i = 0; i < numberOfSubAccounts; i++) {
            if (campaignAccountStatus[subAccounts[i]] == Stages.AcceptingDeposits) {
                campaignAccountStatus[subAccounts[i]] = Stages.ElapsedDeposits;
                // withdrawCampaign(subAccountNames[subAccounts[i]]);
            }
        }
        campaignStatus = 3;
    }


/* GETTERS */
    //Add relevant getters and setters
    function getContractOwner() public view returns(address){
        return _owner;
    }

    function getContractAddress() public view returns(address){
        return address(this);
    }


     // getter for allocation
    function showAllocation() public returns (uint8[] memory allocations){
        uint8[] memory listOfAllocations = new uint8[](getNumberOfAccounts());
        for(uint i = 0; i < subAccounts.length; i++) {
            address tempAddress = subAccounts[i];
            uint8 tempAllocation = subAccountPercentages[tempAddress];
            listOfAllocations[i] = tempAllocation;
            emit Allocation(tempAddress, tempAllocation);
        }
        return listOfAllocations;
    }

    // a general check on how much money the person has put, and how it has been spread
    function getProportions() public view returns (uint[] memory proportions) {
        uint[] memory listOfProportions = new uint[](getNumberOfAccounts());
        for (uint256 i = 0; i < getNumberOfAccounts(); i++) {
            listOfProportions[i] = subAccountPercentages[subAccounts[i]] * amountDonated[msg.sender]; // "Food, 100" e.g.
        }
        return listOfProportions; // e.g. [100, 200, 300]
    }
    
   
    
    function getAccountsInOrder() public view returns (bytes32[] memory accounts) {
        bytes32[] memory listOfAccounts = new bytes32[](getNumberOfAccounts());
        for (uint256 i = 0; i < getNumberOfAccounts(); i++) {
            listOfAccounts[i] = (subAccountNames[subAccounts[i]]); // "Food, 100" e.g.
        }
        return listOfAccounts; // e.g. ["Food", "Water", "Air"]. combine with getProportions() to find out amount of money in each sub wallet
    }


    // given an amount, how much is going to which acc? a way for donors to check where amounts are gg before they donate. 
    //combine with getAccountsInOrder() as well, to find out where in which account
    function checkAmount(uint256 amt) public view returns (uint[] memory amounts) {
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

    //getter for progress of each subaccount in a campaign
    function getSubAccountBalance(bytes32 subAccountName) public view returns(uint256) {
        address temp;
        for (uint i = 0; i < numberOfSubAccounts; i++) {
            if (subAccountNames[subAccounts[i]] == subAccountName) {
                temp = subAccounts[i]; // finding account address using bytes32, since that is fed
            }
        }
        return subAccountBalance[temp];
    }

    function getCampaignStatus() public view returns (uint8) {
        return campaignStatus;
    }

    function getCampaignType() public view returns (uint8) {
        return campaignType;
    }

    function getCampaignGoals() public view returns (uint256[] memory tc) {
        uint256[] memory goals = new uint256[](getNumberOfAccounts());
        for (uint256 i = 0; i < getNumberOfAccounts(); i++) {
            uint256 currentGoal = campaignGoals[subAccounts[i]];
            goals[i] = currentGoal;
        }
        return goals;
    }

    function getDonorsBalance(bytes32 subAccountName, address sender) public view returns (uint256) {
        address temp;
        for (uint i = 0; i < numberOfSubAccounts; i++) {
            if (subAccountNames[subAccounts[i]] == subAccountName) {
                temp = subAccounts[i]; // finding account address using bytes32, since that is fed
            }
        }
        return donorsBalance[temp][sender];
    }

    function getStages() public view returns (bytes32[] memory listOfStages) { // used for charity and donors to monitor status.
        bytes32[] memory stageList = new bytes32[](getNumberOfAccounts());
        for (uint i = 0; i < numberOfSubAccounts; i++) {
            string memory text;
            if (campaignAccountStatus[subAccounts[i]] == Stages.AcceptingDeposits) {
                text = "Accepting Deposits";
            } else if (campaignAccountStatus[subAccounts[i]] == Stages.ReleasingDeposits) {
                text = "Releasing Deposits";
            } else {
                text = "Elapsed Deposits";
            }
            stageList[i] = bytes32(bytes(text));
        }
        return stageList;
    }

    function getDonorListLength(address subAccount) public view returns (uint256) {
        return donorList[subAccount].length;
    }

    //EACH sub-account call this before checkVoteOutcome is called, to reset their votes
    function endVote() public payable {
        uint256 currVoteCount = checkCTBalance(msg.sender);
        subAccountVotes[msg.sender] = currVoteCount;

        emit EndVote(msg.sender, subAccountVotes[msg.sender]);

        //reset voteCount
        //simulate burn tokens by transferring from subaccount to charity
        erc20instance.transfer(address(this), currVoteCount); 
    }

    function checkVoteOutcome() public payable returns(uint256[] memory vc) {
        uint256[] memory voteCounts = new uint256[](getNumberOfAccounts());
        for (uint256 i = 0; i < getNumberOfAccounts(); i++) {
            uint256 currVoteCount = subAccountVotes[subAccounts[i]];
            voteCounts[i] = currVoteCount;
            // emit Tally(subAccounts[i], voteCounts[i]);
        }

        emit TotalTally(voteCounts);   
        return voteCounts;
            
    }
}
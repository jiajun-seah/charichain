// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

// Charities should be able to declare a new campaign
// whereby delayed release of funds is implemented.
// Also should be able to query status of funds per sub-account.

// Declaring a campaign means setting goals for pre-created sub-accounts.
// After a certain time, if goal not met money returned to donors. (We can add that this creates incentive to donate immediately)
// Else if goal hit, funds become available for the charity to use
// A more complicated implementation would be automating the ending of a campaign after a given time, for now we assume charity manually calls function

contract Campaign {
    address[] public subAccounts;
    uint8 public numberOfSubAccounts; //subaccounts sld not exceed 255
    mapping(address => uint8) public subAccountPercentages; // mapping of proportion of amount donated, for each sub-account [0.1, 0.2, 0.3, 0.4] etc
    mapping(address => bytes32) public subAccountNames; // same size as mapping above, stores the name of each subaccount for that charity
    mapping(address => uint256) subAccountBalance; // Maps name of account => account balance. Can switch to address => balance mapping if that is used more (one less conversion step).
    mapping(address => uint256) campaignGoals; // Maps account => goal for that account.
    mapping(address => Stages) campaignAccountStatus; // Maps address to current stage.
    mapping(address => mapping(address => uint256)) donorsBalance; // how much each donor has donated
    mapping(address => mapping(address => bool)) hasDonated;
    mapping(address => address[]) donorList;
    //address[] public donorList;
    uint8 campaignType; // 0 for split if not met, 1 for return to donors if not met, 2 for not started yet, 3 for done already.
    bytes32 campaignName;

    uint public creationTime;
    enum Stages {
        AcceptingDeposits,
        ReleasingDeposits,
        ElapsedDeposits
    }

    address charityOwner;

    // TODO add all the events as per midterm test for testing
    event cannotWithdraw();
    event accountGoalHit(address account, uint256 balance, bytes32 accountName);
    event accountGoalNotHit(address account, uint256 balance, bytes32 accountName);

    constructor(address[] memory sub, uint8 numberOfSub, uint8[] memory percentages, bytes32[] memory names, uint8 campaign, bytes32 nameOfCampaign) {
        charityOwner = msg.sender;
        numberOfSubAccounts = numberOfSub;
        subAccounts = sub;
        campaignType = campaign;
        campaignName = nameOfCampaign;
        for (uint i = 0; i < numberOfSubAccounts; i++) {
            subAccountPercentages[subAccounts[i]] = percentages[i];
            subAccountNames[subAccounts[i]] = names[i];
        }
    }

    // Modifiers
    modifier ownerOnly() {
        require(msg.sender == charityOwner); // has to be instantiated by charity
        _;
    }

    modifier timedTransitions() {
        for (uint i = 0; i < numberOfSubAccounts; i++) {
            if (campaignAccountStatus[subAccounts[i]] == Stages.AcceptingDeposits && block.timestamp >= creationTime + 7 days) {
                campaignAccountStatus[subAccounts[i]] = Stages.ElapsedDeposits;
                emit accountGoalNotHit(subAccounts[i], subAccountBalance[subAccounts[i]], subAccountNames[subAccounts[i]]);
                campaignType = 3;
            }
        }
        _;
    }

    function addCampaignGoals(uint256[] memory allocations) public ownerOnly {
        require(allocations.length == numberOfSubAccounts, "You need to create a goal for each sub-account!");
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
        if (campaignAccountStatus[temp] == Stages.ReleasingDeposits) {
            uint amount = subAccountBalance[temp];
            address payable accountPayable = payable(temp);
            accountPayable.transfer(amount); // transfer is done if target is hit AND the charity rq's for transfer
        } else if (campaignAccountStatus[temp] == Stages.ElapsedDeposits) { // its over without hitting the target.
            uint amount = subAccountBalance[temp];
            if (amount != 0) {
                // two situations: split OR return to donors
                if (campaignType == 0) {
                    uint256 amtDonated = subAccountBalance[temp];
                    for (uint j =0; j < numberOfSubAccounts; j++) {
                        address subAccountAdd = subAccounts[j];
                        uint8 ratio = subAccountPercentages[subAccountAdd];
                        address payable subAccountAddPayable = payable(subAccountAdd);
                        subAccountAddPayable.transfer((ratio / 100) * amtDonated);
                    }
                } else if (campaignType == 1) { // return to donors.
                    for (uint k = 0; k < donorList[temp].length; k++) {
                        uint256 amtToReturn = donorsBalance[temp][donorList[temp][k]];
                        address payable accountPayable = payable(donorList[temp][k]);
                        accountPayable.transfer(amtToReturn);
                    } 
                }
            }
        } else if (campaignAccountStatus[temp] == Stages.AcceptingDeposits) {
            emit cannotWithdraw();
        }
    }

    /* Check if bytes32 as function paramater is fine (special case for gas usage)
    function createSubAccount(bytes32 subAccountName, address subAccountAddress) public ownerOnly() {
        // TODO, make sure to check subAccount does not already exist
    }*/

    function endCampaign() public ownerOnly() {
        // Check if elapsed time has passed
        // Cycle through campaignGoals and check if goal hit. If yes, release funds else return funds. Same as midterm exam.
        // (We have to take this approach and used fixed price token because otherwise very costly to transfer to main account then transfer to sub account with normal eth)
        // Reset campaignGoals, campaignGoalsReached for specific campaigns whose duration has elapsed
    }


    // Getters & Setters
    function getSubAccountBalance(bytes32 subAccountName) public view returns(uint256) {
        address temp;
        for (uint i = 0; i < numberOfSubAccounts; i++) {
            if (subAccountNames[subAccounts[i]] == subAccountName) {
                temp = subAccounts[i]; // finding account address using bytes32, since that is fed
            }
        }
        return subAccountBalance[temp];
    }

    function getCampaignType() public view returns (uint8) {
        return campaignType;
    }
    // Any ownerOnly functions that want to use funds from subAccount first checks that account not in campaignGoals and if it is, then at least campaignGoal is met
}
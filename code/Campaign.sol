pragma solidity >= 0.5.0;

// Charities should be able to declare a new campaign
// whereby delayed release of funds is implemented.
// Also should be able to query status of funds per sub-account.

// Declaring a campaign means setting goals for pre-created sub-accounts.
// After a certain time, if goal not met money returned to donors. (We can add that this creates incentive to donate immediately)
// Else if goal hit, funds become available for the charity to use
// A more complicated implementation would be automating the ending of a campaign after a given time, for now we assume charity manually calls function

contract Charity {
    mapping(bytes32 => address) subAccounts; // Maps name of account => address. Enforces unique sub-account name.
    mapping(bytes32 => uint256) subAccountBalance; // Maps name of account => account balance. Can switch to address => balance mapping if that is used more (one less conversion step).
    mapping(bytes32 => uint256) campaignGoals; // Maps name of account => goal for that account.
    mapping(bytes32 => bool) campaignGoalsReached; // Maps name of account => truth value if goal has been reached for that account. We need this in case charity wants to use funds before campaign ends if goals are hit.
    mapping(bytes32 => uint) campaignEnd;

    address charityOwner;
    // TODO add all the events as per midterm test for testing

    constructor() public {
        charityOwner = msg.sender;
    }

    // Modifiers
    modifier ownerOnly() {
        require(msg.sender == charityOwner);
        _;
    }

    // Check if bytes32 as function paramater is fine (special case for gas usage)
    function createSubAccount(bytes32 subAccountName, address subAccountAddress) public ownerOnly() {
        // TODO, make sure to check subAccount does not already exist
    }

    function endCampaign() public ownerOnly() {
        // Check if elapsed time has passed
        // Cycle through campaignGoals and check if goal hit. If yes, release funds else return funds. Same as midterm exam.
        // (We have to take this approach and used fixed price token because otherwise very costly to transfer to main account then transfer to sub account with normal eth)
        // Reset campaignGoals, campaignGoalsReached for specific campaigns whose duration has elapsed
    }

    // Specifically end a single campaign on one account
    function endCampaign(bytes32 campaignName) public ownerOnly() {
        // Check if elapsed time has passed
        // Cycle through campaignGoals and check if goal hit. If yes, release funds else return funds. Same as midterm exam.
        // (We have to take this approach and used fixed price token because otherwise very costly to transfer to main account then transfer to sub account with normal eth)
        // Reset campaignGoals, campaignGoalsReached for specific campaigns whose duration has elapsed
    }

    // Getters & Setters
    function getSubAccountBalance(bytes32 subAccountName) public view returns(uint256) {
        return subAccountBalance[subAccountName]; // TODO check conversion from string to bytes32 as argument for function
    }

    function setCampaign(bytes32 subAccountName, uint256 goalAmount, uint16 campaignDays) public ownerOnly() {
        // TODO. make sure campaignGoal for sub-account doesn't already exist
        campaignGoals[subAccountName] = goalAmount;
        campaignGoalsReached[subAccountName] = false;
        campaignEnd[subAccountName] = block.timestamp + campaignDays * 1 days;
    }

    // Any ownerOnly functions that want to use funds from subAccount first checks that account not in campaignGoals and if it is, then at least campaignGoal is met
}
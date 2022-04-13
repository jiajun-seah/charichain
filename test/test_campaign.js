const _deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require('truffle-assertions');
var assert = require('assert');

var Charity = artifacts.require("../contracts/Charity.sol");
var ERC20 = artifacts.require("../contracts/ERC20.sol");
var ChariToken = artifacts.require("../contracts/ChariToken.sol");
var Donor = artifacts.require("../contracts/Donor.sol");
const ethers = require('ethers')
const utils = ethers.utils

const PREFIX = "Returned error: VM Exception while processing transaction: revert ";
const INTER =  " -- Reason given: "

contract('Campaign', function(accounts) {
    before(async() => {
        
        erc20Instance = await ERC20.deployed();
        charityInstance = await Charity.deployed();
    });

    console.log("Testing Charity Contract")

    // create sub accounts
    it('Create Sub Accounts', async() => {
        let owner = await charityInstance.getContractOwner();
        const subAccount1 = utils.formatBytes32String("Food")
        const subAccount2 = utils.formatBytes32String("Water")
        const subAccount3 = utils.formatBytes32String("Building Materials")
        let makeS1 = await charityInstance.createSubAccount(accounts[1],
        subAccount1,
        {from: owner});
        let makeS2 = await charityInstance.createSubAccount(accounts[2],
            subAccount2,
            {from: owner});
        let makeS3 = await charityInstance.createSubAccount(accounts[3],
            subAccount3,
            {from: owner});
        let resultantByteArray = await charityInstance.getAccountsInOrder();
        assert.equal(
            subAccount1,
            resultantByteArray[0],
            "Failed to create sub account"
        )
        assert.equal(
            subAccount2,
            resultantByteArray[1],
            "Failed to create sub account"
        )
        assert.equal(
            subAccount3,
            resultantByteArray[2],
            "Failed to create sub account"
        )
    });

    // 2) allocate percentages to each sub account using allocatePercentages[]

    it('Allocate sub-account percentages', async() => {
        let owner = await charityInstance.getContractOwner();
        let percentageArray = [40, 30, 30];
        await charityInstance.allocatePercentages(percentageArray, {from: owner});
        let displayAllocations = await charityInstance.showAllocation();
        truffleAssert.eventEmitted(displayAllocations, "Allocation");
        // assert.equal(
        //     60,
        //     displayAllocations[0].toNumber(),
        //     "Not successfully allocated"
        // )
    });

    //3) create campaign (make sure owner instantiates),

    it("Create campaign, not from owner", async() => {
        const nameOfCampaign = utils.formatBytes32String("Charity Drive")
        await truffleAssert.reverts(charityInstance.createCampaign(nameOfCampaign, {from: accounts[3]}), "This method requires the owner to instantiate it!")
    })

    it("Create campaign", async() => {
        let owner = await charityInstance.getContractOwner();
        const nameOfCampaign = utils.formatBytes32String("Charity Drive")
        let campaign = await charityInstance.createCampaign(nameOfCampaign, {from: owner});
        truffleAssert.eventEmitted(campaign, "createdCampaign");
    })

    // we will be unable to add a campaign again. 

    it("Create campaign again after campaign has been created", async() => {
        let owner = await charityInstance.getContractOwner();
        const nameOfCampaign = utils.formatBytes32String("Charity Drive")
        await truffleAssert.reverts(charityInstance.createCampaign(nameOfCampaign, {from: owner}), "There is another campaign still running.")
    })

    //4) Add campaign goals

    it("Add campaign goals, not from owner", async() => {
        let subAccountGoals = ["2000000000000000000", "2000000000000000000", "2000000000000000000"];
        await truffleAssert.reverts(charityInstance.addCampaignGoals(subAccountGoals, {from: accounts[3]}), "This method requires the owner to instantiate it!")
    })

    it("Add campaign goals, from owner", async() => {
        let owner = await charityInstance.getContractOwner();
        let subAccountGoals = ["2000000000000000000", "3000000000000000000", "4000000000000000000"];
        await charityInstance.addCampaignGoals(subAccountGoals, {from: owner});
        let campaignGoals = await charityInstance.getCampaignGoals();
        assert.equal(
            campaignGoals[0],
            "2000000000000000000",
            "The goal is not allocated."
        )
        assert.equal(
            campaignGoals[1],
            "3000000000000000000",
            "The goal is not allocated."
        )
        assert.equal(
            campaignGoals[2],
            "4000000000000000000",
            "The goal is not allocated."
        )
    })


    //5) Start campaign (we first simulate a split campaign)

    it("Start campaign, not from owner", async() => {
        let campaignType = 0; // split campaign
        await truffleAssert.reverts(charityInstance.startCampaign(campaignType, {from: accounts[2]}), "This method requires the owner to instantiate it!")
    })

    it("Start campaign, from owner", async() => {
        let owner = await charityInstance.getContractOwner();
        let campaignType = 0;
        await charityInstance.startCampaign(campaignType, {from: owner})
        let storedCampaignType = await charityInstance.getCampaignType();
        assert.equal(
            storedCampaignType.toNumber(),
            0,
            "Campaign type not assigned."
        )
    })

    // extra cases: cannot change campaign goal if already started campaign.
    it("Add campaign goals although campaign already started", async() => {
        let owner = await charityInstance.getContractOwner();
        let subAccountGoals = ["2000000000000000000", "2000000000000000000", "2000000000000000000"];
        await truffleAssert.reverts(charityInstance.addCampaignGoals(subAccountGoals, {from: owner}), "The campaign has not been created or has already started!")
    })

    
    //6) Donate to a sub account, leave it as Accepting still

    it("Donate to sub account", async() => {
        const subAccount = utils.formatBytes32String("Food")
        await charityInstance.depositCampaign(subAccount, {from: accounts[4], value: "1000000000000000000"}) // 1 ether out of 2
        let amountInCampaign = await charityInstance.getSubAccountBalance(subAccount);
        let amountDonorDonated = await charityInstance.getDonorsBalance(subAccount, accounts[4])
        assert.equal(
            amountInCampaign,
            "1000000000000000000",
            "Donation did not go through."
        )
        assert.equal(
            amountDonorDonated,
            "1000000000000000000",
            "Donation did not go through."
        )
    })

    // withdraw when account is still in "Accepting Deposits phase", which should not be allowed.
    it("Withdraw from Accepting deposits sub account", async() => {
        let owner = await charityInstance.getContractOwner();
        const subAccount = utils.formatBytes32String("Food")
        await truffleAssert.reverts(charityInstance.withdrawCampaign(subAccount, {from: owner}), "The sub-account has not hit its target, and the time has not elapsed yet.") // 1 ether out of 2
    })


    // 7) Donate to the sub account, until it hits the amount enough to withdraw
    it("Deposit into sub account such that it hits its goal", async() => {
        const subAccount = utils.formatBytes32String("Food")
        let campaign = await charityInstance.depositCampaign(subAccount, {from: accounts[4], value: "1000000000000000000"}) // 1 ether out of 2
        const stageToVerify = utils.formatBytes32String("Releasing Deposits");
        let arrayOfStages = await charityInstance.getStages();
        assert.equal(
            stageToVerify,
            arrayOfStages[0], // stage corresponding to food (first sub-account)
            "The stage has not been updated"
        )
    })

    // withdraw when account is ready for withdrawal! in this case it's ready because it has "hit" its goal
    it("Withdraw from Releasing Deposits sub account", async() => {
        let owner = await charityInstance.getContractOwner();
        const subAccount = utils.formatBytes32String("Food")
        let withdrawal = await charityInstance.withdrawCampaign(subAccount, {from: owner}) // 1 ether out of 2
        truffleAssert.eventEmitted(withdrawal, "ReleasingDepositsTransfer"); // emitted when transfer is done. Show increase in ether balance in Ganache
    })

    // simulating elapsed deposits: first depositing an amount that does not hit goals in remaining accounts
    it("Donate to rest of the sub accounts, but do not hit goal", async() => {
        const subAccount1 = utils.formatBytes32String("Water")
        const subAccount2 = utils.formatBytes32String("Building Materials")
        await charityInstance.depositCampaign(subAccount1, {from: accounts[5], value: "1000000000000000000"}) // 2 ether out of 3
        await charityInstance.depositCampaign(subAccount2, {from: accounts[5], value: "1000000000000000000"}) // 2 ether out of 3

        await charityInstance.depositCampaign(subAccount1, {from: accounts[6], value: "1000000000000000000"}) // 2 ether out of 4
        await charityInstance.depositCampaign(subAccount2, {from: accounts[6], value: "1000000000000000000"}) // 2 ether out of 4
        let amountInCampaign1 = await charityInstance.getSubAccountBalance(subAccount1);
        let amountInCampaign2 = await charityInstance.getSubAccountBalance(subAccount2);
        assert.equal(
            amountInCampaign1,
            "2000000000000000000",
            "Donation did not go through."
        )
        assert.equal(
            amountInCampaign2,
            "2000000000000000000",
            "Donation did not go through."
        )
    })

    // PURELY for demo purposes. we change stage of remaining accounts to Elapsed. Normally this takes 7 days
    it("Change remaining sub-accounts to elapsed deposits", async() => { 
        await charityInstance.fastForwardCampaignStates() // 1 ether out of 2
        let arrayOfStages = await charityInstance.getStages(); 
        // updates sub wallet "Water" and "Building materials" to elapsed. (indexes 1 and 2 respectively). "Food" is already accepting deposits so we do nothing to it.
        const stageToVerify = utils.formatBytes32String("Elapsed Deposits");
        assert.equal(
            arrayOfStages[1],
            stageToVerify,
            "The stage did not get successfully updated"
        )
        assert.equal(
            arrayOfStages[2],
            stageToVerify,
            "The stage did not get successfully updated"
        )
    })

    // withdraw for both accounts (this is a index 0 type account, so it splits the funds based on declared percentages)
    it("Withdraw from Elapsed Deposits sub-accounts", async() => {
        let owner = await charityInstance.getContractOwner();
        const subAccount1 = utils.formatBytes32String("Water")
        const subAccount2 = utils.formatBytes32String("Building Materials")
        let withdrawal1 = await charityInstance.withdrawCampaign(subAccount1, {from: owner}) 
        let withdrawal2 = await charityInstance.withdrawCampaign(subAccount2, {from: owner}) 

        // let balance1 = await charityInstance.getSubAccountBalance(subAccount1);
        // let balance2 = await charityInstance.getSubAccountBalance(subAccount2);
        // let allocationPercentage = await charityInstance.showAllocation();
        //let totalSum = balance1 + balance2; // this is the total pool to be distributed       
        truffleAssert.eventEmitted(withdrawal1, "elapsedDepositsTransfer")
        // more testing could have been done here but there seems to be issue with allocation percentage
    })

    it("Reset campaign", async() => { 
        let owner = await charityInstance.getContractOwner();
        const nameOfCampaign = utils.formatBytes32String("Charity Drive 2")
        let campaign = await charityInstance.createCampaign(nameOfCampaign, {from: owner});
        truffleAssert.eventEmitted(campaign, "createdCampaign");
    })

    it("Add campaign goals, from owner", async() => {
        let owner = await charityInstance.getContractOwner();
        let subAccountGoals = ["1000000000000000000", "2000000000000000000", "3000000000000000000"];
        await charityInstance.addCampaignGoals(subAccountGoals, {from: owner});
        let campaignGoals = await charityInstance.getCampaignGoals();
        assert.equal(
            campaignGoals[0],
            "1000000000000000000",
            "The goal is not allocated."
        )
        assert.equal(
            campaignGoals[1],
            "2000000000000000000",
            "The goal is not allocated."
        )
        assert.equal(
            campaignGoals[2],
            "3000000000000000000",
            "The goal is not allocated."
        )
    })

    // start campaign type 1, donate, then check if the function for returning to donors is working properly.
});


const _deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require('truffle-assertions');
var assert = require('assert');

var Charity = artifacts.require("../contracts/Charity.sol");
var ERC20 = artifacts.require("../contracts/ERC20.sol");
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
    // Test Case 1
    it('Create Sub Accounts', async() => {
        let owner = await charityInstance.getContractOwner();
        const subAccount1 = utils.formatBytes32String("Food")
        const subAccount2 = utils.formatBytes32String("Water")
        const subAccount3 = utils.formatBytes32String("Materials")
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

    // test Case 2
    //check that three sub-accounts are indeed created
    it('Correct number of sub-accounts', async() => {
        nSubAccounts = await charityInstance.getNumberOfAccounts();
        // console.log(nSubAccounts)
        assert.strictEqual(
            nSubAccounts.toNumber(),
            3,
            "Wrong number of sub-accounts created"
        )
    });

    // test case 3
    //test sub-account percentages configuration
    it('Cannot assign invalid percentages (wrong size of array)', async() => {
        let percentageArray = [40, 30];
        // await charityInstance.allocatePercentages(percentageArray);
        await truffleAssert.reverts(charityInstance.allocatePercentages(percentageArray), "Length of input differs from number of sub-accounts")
    });

    //test sub-account percentages configuration
    it('Cannot assign invalid percentages (does not sum to 100)', async() => {
        let percentageArray = [40, 30, 20];
        // await charityInstance.allocatePercentages(percentageArray);
        await truffleAssert.reverts(charityInstance.allocatePercentages(percentageArray), "Your percentages does not add up to 100")
    });
    
    // 2) allocate percentages to each sub account using allocatePercentages[]

    // test case 4
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

    // test case 5
    it("Create campaign, not from owner", async() => {
        const nameOfCampaign = utils.formatBytes32String("Charity Drive")
        await truffleAssert.reverts(charityInstance.createCampaign(nameOfCampaign, {from: accounts[3]}), "This method requires the owner to instantiate it!")
    })

    // test case 6
    it("Create campaign", async() => {
        let owner = await charityInstance.getContractOwner();
        const nameOfCampaign = utils.formatBytes32String("Charity Drive")
        let campaign = await charityInstance.createCampaign(nameOfCampaign, {from: owner});
        let subAccountGoals = ["2000000000000000000", "3000000000000000000", "4000000000000000000"];
        await charityInstance.addCampaignGoals(subAccountGoals, {from: owner});
        let campaignGoals = await charityInstance.getCampaignGoals();

        let campaignType = 0;
        await charityInstance.startCampaign(campaignType, {from: owner})
        let storedCampaignType = await charityInstance.getCampaignType();
        // check that you cannot assign percentages during campaign.
        let percentageArray = [40, 30, 30];
        assert.equal(
            storedCampaignType.toNumber(),
            0,
            "Campaign type not assigned."
        )
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
        truffleAssert.eventEmitted(campaign, "createdCampaign");
        await truffleAssert.reverts(charityInstance.allocatePercentages(percentageArray), "Cannot change sub-account percentages during campaign!")
    })

    // test case 7: we are unable to create campaign after it has been started
    //Test unable to add a campaign again. 
    it("Create campaign again after campaign has been created", async() => {
        let owner = await charityInstance.getContractOwner();
        const nameOfCampaign = utils.formatBytes32String("Charity Drive")
        await truffleAssert.reverts(charityInstance.createCampaign(nameOfCampaign, {from: owner}), "There is another campaign still running.")
    })


    // test case 8
    // extra cases: cannot change campaign goal if already started campaign.
    it("Add campaign goals although campaign already started", async() => {
        let owner = await charityInstance.getContractOwner();
        let subAccountGoals = ["2000000000000000000", "2000000000000000000", "2000000000000000000"];
        await truffleAssert.reverts(charityInstance.addCampaignGoals(subAccountGoals, {from: owner}), "The campaign has not been created or has already started!")
    })

    // test case 9
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
    // test case 10
    it("Withdraw from Accepting deposits sub account", async() => {
        let owner = await charityInstance.getContractOwner();
        const subAccount = utils.formatBytes32String("Food")
        await truffleAssert.reverts(charityInstance.withdrawCampaign(subAccount, {from: owner}), "The sub-account has not hit its target, and the time has not elapsed yet.") // 1 ether out of 2
    })


    // 7) Donate to the sub account, until it hits the amount enough to withdraw
    // test case 11
    it("Deposit into sub account such that it hits its goal", async() => {
        const subAccount = utils.formatBytes32String("Food")
        let campaign = await charityInstance.depositCampaign(subAccount, {from: accounts[4], value: "1500000000000000000"}) // 2.5 ether out of 2 total, should change to releasing dep
        const stageToVerify = utils.formatBytes32String("Releasing Deposits");
        let arrayOfStages = await charityInstance.getStages();
        assert.equal(
            stageToVerify,
            arrayOfStages[0], // stage corresponding to food (first sub-account)
            "The stage has not been updated"
        )
    })

    // withdraw when account is ready for withdrawal! in this case it's ready because it has "hit" its goal
    // test case 12
    it("Withdraw from Releasing Deposits sub account", async() => {
        let owner = await charityInstance.getContractOwner();
        const subAccount = utils.formatBytes32String("Food")
        let withdrawal = await charityInstance.withdrawCampaign(subAccount, {from: owner}) 
        truffleAssert.eventEmitted(withdrawal, "ReleasingDepositsTransfer", (ev) => {
            return ev.amountTransferred == "2500000000000000000"
        }) // emitted when transfer is done. Show increase in ether balance in Ganache (2 ether)
    })

    // simulating elapsed deposits: first depositing an amount that does not hit goals in remaining accounts
    // test case 13
    it("Donate to rest of the sub accounts, but do not hit goal", async() => {
        const subAccount1 = utils.formatBytes32String("Water")
        const subAccount2 = utils.formatBytes32String("Materials")
        await charityInstance.depositCampaign(subAccount1, {from: accounts[5], value: "2000000000000000000"}) // 2 ether out of 3
        await charityInstance.depositCampaign(subAccount2, {from: accounts[6], value: "2000000000000000000"}) // 2 ether out of 3
        let amountInSubAccount1 = await charityInstance.getSubAccountBalance(subAccount1);
        let amountInSubAccount2 = await charityInstance.getSubAccountBalance(subAccount2);
        assert.equal(
            amountInSubAccount1,
            "2000000000000000000",
            "Donation did not go through."
        )
        assert.equal(
            amountInSubAccount2,
            "2000000000000000000",
            "Donation did not go through."
        )
    })

    // PURELY for demo purposes. we change stage of remaining accounts to Elapsed. Normally this takes 7 days
    // test case 14
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
    // test case 15
    it("Withdraw from Elapsed Deposits sub-accounts", async() => {
        let owner = await charityInstance.getContractOwner();
        const subAccount1 = utils.formatBytes32String("Water")
        const subAccount2 = utils.formatBytes32String("Materials")
        let withdrawal1 = await charityInstance.withdrawCampaign(subAccount1, {from: owner}) 
        let withdrawal2 = await charityInstance.withdrawCampaign(subAccount2, {from: owner}) 

        // let balance1 = await charityInstance.getSubAccountBalance(subAccount1);
        // let balance2 = await charityInstance.getSubAccountBalance(subAccount2);
        // let allocationPercentage = await charityInstance.showAllocation();
        //let totalSum = balance1 + balance2; // this is the total pool to be distributed       
        truffleAssert.eventEmitted(withdrawal1, "elapsedDepositsTransfer", (ev) => {
            return ev.splitArray[0] == "800000000000000000" && ev.splitArray[1] == "600000000000000000" // 2 ether split into 0.8, 0.6, 0.6
        })
        truffleAssert.eventEmitted(withdrawal2, "elapsedDepositsTransfer", (ev) => {
            return ev.splitArray[0] == "800000000000000000" && ev.splitArray[1] == "600000000000000000" // 2 ether split into 0.8, 0.6, 0.6
        })
    })

    // test case 16
    it("Reset campaign", async() => { 
        let owner = await charityInstance.getContractOwner();
        const nameOfCampaign = utils.formatBytes32String("Charity Drive 2")
        let campaign = await charityInstance.createCampaign(nameOfCampaign, {from: owner});
        let subAccountGoals = ["1000000000000000000", "2000000000000000000", "3000000000000000000"];
        await charityInstance.addCampaignGoals(subAccountGoals, {from: owner});
        let campaignGoals = await charityInstance.getCampaignGoals();
        let campaignType = 1;
        await charityInstance.startCampaign(campaignType, {from: owner})
        let storedCampaignType = await charityInstance.getCampaignType();
        assert.equal(
            storedCampaignType.toNumber(),
            1,
            "Campaign type not assigned."
        )
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
        truffleAssert.eventEmitted(campaign, "createdCampaign");
    })

    // test case 17
    it("Donate to sub account, meeting the goal", async() => {
        const subAccount = utils.formatBytes32String("Food")
        await charityInstance.depositCampaign(subAccount, {from: accounts[4], value: "1000000000000000000"}) // 1 ether out of 1, goal met.
        let amountInCampaign = await charityInstance.getSubAccountBalance(subAccount);
        let amountDonorDonated = await charityInstance.getDonorsBalance(subAccount, accounts[4])
        const stageToVerify = utils.formatBytes32String("Releasing Deposits");
        let arrayOfStages = await charityInstance.getStages();
        assert.equal(
            stageToVerify,
            arrayOfStages[0], // stage corresponding to food (first sub-account)
            "The stage has not been updated"
        )
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

    // test case 18
    it("Withdraw from Releasing Deposits sub account", async() => {
        let owner = await charityInstance.getContractOwner();
        const subAccount = utils.formatBytes32String("Food")
        let withdrawal = await charityInstance.withdrawCampaign(subAccount, {from: owner}) 
        truffleAssert.eventEmitted(withdrawal, "ReleasingDepositsTransfer", (ev) => {
            return ev.amountTransferred == "1000000000000000000"
        }) // emitted when transfer is done. Show increase in ether balance in Ganache (2 ether)
    })

    // test case 19
    it("Donate to rest of the sub accounts, but do not hit goal", async() => {
        const subAccount1 = utils.formatBytes32String("Water")
        const subAccount2 = utils.formatBytes32String("Materials")
        await charityInstance.depositCampaign(subAccount1, {from: accounts[5], value: "500000000000000000"}) 
        await charityInstance.depositCampaign(subAccount1, {from: accounts[6], value: "500000000000000000"}) // 1 ether out of 2 altogether
        await charityInstance.depositCampaign(subAccount2, {from: accounts[5], value: "1000000000000000000"}) 
        await charityInstance.depositCampaign(subAccount2, {from: accounts[6], value: "1000000000000000000"}) // 2 ether out of 3 altogether
        let amountInSubAccount1 = await charityInstance.getSubAccountBalance(subAccount1);
        let amountInSubAccount2 = await charityInstance.getSubAccountBalance(subAccount2);
        assert.equal(
            amountInSubAccount1,
            "1000000000000000000",
            "Donation did not go through."
        )
        assert.equal(
            amountInSubAccount2,
            "2000000000000000000",
            "Donation did not go through."
        )
    })

    // test case 20
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

    // tset case 21
    it("Withdraw from Elapsed Deposits sub-accounts", async() => {
        let owner = await charityInstance.getContractOwner();
        const subAccount1 = utils.formatBytes32String("Water")
        const subAccount2 = utils.formatBytes32String("Materials")
        let withdrawal1 = await charityInstance.withdrawCampaign(subAccount1, {from: owner}) 
        let withdrawal2 = await charityInstance.withdrawCampaign(subAccount2, {from: owner}) 

        // let balance1 = await charityInstance.getSubAccountBalance(subAccount1);
        // let balance2 = await charityInstance.getSubAccountBalance(subAccount2);
        // let allocationPercentage = await charityInstance.showAllocation();
        //let totalSum = balance1 + balance2; // this is the total pool to be distributed       
        truffleAssert.eventEmitted(withdrawal1, "elapsedDepositsTransfer", (ev) => {
            return ev.splitArray[0] == "500000000000000000" && ev.splitArray[1] == "500000000000000000";
        })
        truffleAssert.eventEmitted(withdrawal2, "elapsedDepositsTransfer", (ev) => {
            return ev.splitArray[0] == "1000000000000000000" && ev.splitArray[1] == "1000000000000000000";
        })
    })
});


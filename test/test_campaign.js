// const _deploy_contracts = require("../migrations/2_deploy_contracts");
// const truffleAssert = require('truffle-assertions');
// var assert = require('assert');

// var Charity = artifacts.require("../contracts/Charity.sol");
// var ERC20 = artifacts.require("../contracts/ERC20.sol");
// var ChariToken = artifacts.require("../contracts/ChariToken.sol");
// var Donor = artifacts.require("../contracts/Donor.sol");
// const ethers = require('ethers')
// const utils = ethers.utils

// const PREFIX = "Returned error: VM Exception while processing transaction: revert ";
// const INTER =  " -- Reason given: "

// contract('Campaign', function(accounts) {
//     before(async() => {
        
//         erc20Instance = await ERC20.deployed();
//         charityInstance = await Charity.deployed();
//     });

//     console.log("Testing Charity Contract")

//     // create sub accounts
//     it('Create Sub Accounts', async() => {
//         let owner = await charityInstance.getContractOwner();
//         const subAccount1 = utils.formatBytes32String("Food")
//         const subAccount2 = utils.formatBytes32String("Water")
//         const subAccount3 = utils.formatBytes32String("Building Materials")
//         let makeS1 = await charityInstance.createSubAccount(accounts[1],
//         subAccount1,
//         {from: owner});
//         let makeS2 = await charityInstance.createSubAccount(accounts[2],
//             subAccount2,
//             {from: owner});
//         let makeS3 = await charityInstance.createSubAccount(accounts[3],
//             subAccount3,
//             {from: owner});
//         let resultantByteArray = await charityInstance.getAccountsInOrder();
//         assert.equal(
//             subAccount1,
//             resultantByteArray[0],
//             "Failed to create sub account"
//         )
//         assert.equal(
//             subAccount2,
//             resultantByteArray[1],
//             "Failed to create sub account"
//         )
//         assert.equal(
//             subAccount3,
//             resultantByteArray[2],
//             "Failed to create sub account"
//         )
//     });

//     // 2) allocate percentages to each sub account using allocatePercentages[]

//     it('Allocate sub-account percentages', async() => {
//         let owner = await charityInstance.getContractOwner();
//         let percentageArray = [40, 40, 20];
//         await charityInstance.allocatePercentages(percentageArray, {from: owner});
//         let displayAllocations = await charityInstance.showAllocation();
//         truffleAssert.eventEmitted(displayAllocations, "Allocation");
//         // assert.equal(
//         //     60,
//         //     displayAllocations[0].toNumber(),
//         //     "Not successfully allocated"
//         // )
//     });

//     //3) create campaign (make sure owner instantiates),

//     it("Create campaign, not from owner", async() => {
//         const nameOfCampaign = utils.formatBytes32String("Charity Drive")
//         await truffleAssert.reverts(charityInstance.createCampaign(nameOfCampaign, {from: accounts[3]}), "This method requires the owner to instantiate it!")
//     })

//     it("Create campaign", async() => {
//         let owner = await charityInstance.getContractOwner();
//         const nameOfCampaign = utils.formatBytes32String("Charity Drive")
//         let campaign = await charityInstance.createCampaign(nameOfCampaign, {from: owner});
//         truffleAssert.eventEmitted(campaign, "createdCampaign");
//     })

//     // we will be unable to add a campaign again. 

//     it("Create campaign again after campaign has been created", async() => {
//         let owner = await charityInstance.getContractOwner();
//         const nameOfCampaign = utils.formatBytes32String("Charity Drive")
//         await truffleAssert.reverts(charityInstance.createCampaign(nameOfCampaign, {from: owner}), "There is another campaign still running.")
//     })

//     //4) Add campaign goals

//     it("Add campaign goals, not from owner", async() => {
//         let subAccountGoals = ["2000000000000000000", "2000000000000000000", "2000000000000000000"];
//         await truffleAssert.reverts(charityInstance.addCampaignGoals(subAccountGoals, {from: accounts[3]}), "This method requires the owner to instantiate it!")
//     })

//     it("Add campaign goals, from owner", async() => {
//         let owner = await charityInstance.getContractOwner();
//         let subAccountGoals = ["2000000000000000000", "3000000000000000000", "4000000000000000000"];
//         await charityInstance.addCampaignGoals(subAccountGoals, {from: owner});
//         let campaignGoals = await charityInstance.getCampaignGoals();
//         assert.equal(
//             campaignGoals[0],
//             "2000000000000000000",
//             "The goal is not allocated."
//         )
//         assert.equal(
//             campaignGoals[1],
//             "3000000000000000000",
//             "The goal is not allocated."
//         )
//         assert.equal(
//             campaignGoals[2],
//             "4000000000000000000",
//             "The goal is not allocated."
//         )
//     })


//     //5) Start campaign

//     it("Start campaign, not from owner", async() => {
//         let campaignType = 0;
//         await truffleAssert.reverts(charityInstance.startCampaign(campaignType, {from: accounts[2]}), "This method requires the owner to instantiate it!")
//     })

//     it("Start campaign, from owner", async() => {
//         let owner = await charityInstance.getContractOwner();
//         let campaignType = 0;
//         await charityInstance.startCampaign(campaignType, {from: owner})
//         let storedCampaignType = await charityInstance.getCampaignType();
//         assert.equal(
//             storedCampaignType.toNumber(),
//             0,
//             "Campaign type not assigned."
//         )
//     })

//     // extra cases: cannot change campaign goal if already started campaign.
//     it("Add campaign goals although campaign already started", async() => {
//         let owner = await charityInstance.getContractOwner();
//         let subAccountGoals = ["2000000000000000000", "2000000000000000000", "2000000000000000000"];
//         await truffleAssert.reverts(charityInstance.addCampaignGoals(subAccountGoals, {from: owner}), "The campaign has not been created or has already started!")
//     })

    
//     //6) Donate to a sub account. This is where I got last stuck at

//     it("Donate to sub account", async() => {
//         const subAccount = utils.formatBytes32String("Food")
//         await charityInstance.depositCampaign(subAccount, {from: accounts[4], value: "1000000000000000000"}) // 1 ether out of 2
//         let amountInCampaign = await charityInstance.getSubAccountBalance(subAccount);
//         assert.equal(
//             amountInCampaign,
//             "1000000000000000000",
//             "Donation did not go through."
//         )
//     })

// });


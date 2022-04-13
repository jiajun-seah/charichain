const _deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require('truffle-assertions');
var assert = require('assert');

var Charity = artifacts.require("../contracts/Charity.sol");
var ERC20 = artifacts.require("../contracts/ERC20.sol");
var Campaign = artifacts.require("../contracts/Campaign.sol");

const ethers = require('ethers')
const utils = ethers.utils

const PREFIX = "Returned error: VM Exception while processing transaction: revert ";
const INTER =  " -- Reason given: "

contract('Charity', function(accounts) {
    console.log("About to Deploy")
    before(async() => {
        
        erc20Instance = await ERC20.deployed();
        charityInstance = await Charity.deployed();
        // campaignInstance = await Campaign.deployed();
        
    });

    console.log("Testing Charity Contract")

    // test sub-account creation
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

    it('Correct number of sub-accounts', async() => {
        nSubAccounts = await charityInstance.getNumberOfAccounts();
        // console.log(nSubAccounts)
        assert.strictEqual(
            nSubAccounts.toNumber(),
            3,
            "Wrong number of sub-accounts created"
        )

    });

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

    //test sub-account percentages configuration
    it('Allocate sub-account percentages', async() => {
        let percentageArray = [40, 30, 30];
        await charityInstance.allocatePercentages(percentageArray);
        let displayAllocations = await charityInstance.showAllocation();
        // console.log(resultantAllocations);
        truffleAssert.eventEmitted(displayAllocations, "Allocation");
    });

    //test CT conversion
    it('Eth to CT conversion calculation', async() => {
        let amtInCT = await charityInstance.convertToCredits("100000000000000000");
        assert.strictEqual(amtInCT.toNumber(), 10, "Conversion method calculation is wrong");
    });

    //test entire donate
    it('Donors can donate', async() => {
        let donor = accounts[8];
        // let owner = await charityInstance.getContractOwner();
        // console.log("About to call donate");
        let donation =  await charityInstance.donate({from:donor, value:"100000000000000000"});
        // console.log("Donate finished");
        
        truffleAssert.eventEmitted(donation, "Donated");

        // let contractAddress = await charityInstance.getContractAddress();
        // assert.strictEqual(contractAddress.balance, "100000000000000000", "Funds not transferred to main account");

        let checkCT = await charityInstance.checkCTBalance(donor);
        assert.strictEqual(checkCT.toNumber(), 10, "transferCTViaVote not deployed correctly");
        
        // const subAccount1 = utils.formatBytes32String("Food")
        // const subAccount2 = utils.formatBytes32String("Water")
        // const subAccount3 = utils.formatBytes32String("Building Materials")
        // let subBal1 =  await charityInstance.getSubAccountBalance(subAccount1);
        // console.log(subBal1);
        // console.log(subBal1.toNumber());
        assert.strictEqual(accounts[1].balance , "100040000000000000000", "Funds not transferred to first sub-account");
    });

    //test can transfer CT donor to subaccount (voting)
    it('Donors can transfer CT to sub-account', async() => {
        let donor = accounts[8];
        // let owner = await charityInstance.getContractOwner(); 
        let sendCTviavote =  await charityInstance.transferCTViaVote(accounts[1], 2, {from:donor});
        
        truffleAssert.eventEmitted(sendCTviavote, "TransferViaVote");

        let checkCT = await charityInstance.checkCTBalance(accounts[1]);
        assert.strictEqual(checkCT.toNumber(), 2, "transferCTViaVote not deployed correctly");
    });

    //test vote
    it('Donors cannot vote with insufficient CT', async() => {
        let donor = accounts[8];
        await truffleAssert.reverts(charityInstance.vote(accounts[2], 11, {from:donor}), "You don't have enough ChariTokens to vote")
    });

    it('Donors can vote', async() => {
        let donor = accounts[8];
        let vote =  await charityInstance.vote(accounts[2], 3, {from:donor});
        
        truffleAssert.eventEmitted(vote, "Voted");

        let checkCT = await charityInstance.checkCTBalance(accounts[2]);
        assert.strictEqual(checkCT.toNumber(), 3, "transferCTViaVote not deployed correctly");
    });




});


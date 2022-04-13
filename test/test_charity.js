const _deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require('truffle-assertions');
var assert = require('assert');

var Charity = artifacts.require("../contracts/Charity.sol");
var ERC20 = artifacts.require("../contracts/ERC20.sol");
var Campaign = artifacts.require("../contracts/Campaign.sol");

const PREFIX = "Returned error: VM Exception while processing transaction: revert ";
const INTER =  " -- Reason given: "

contract('Charity', function(accounts) {
    console.log("About to Deploy")
    before(async() => {
        
        erc20Instance = await ERC20.deployed();
        charityInstance = await Charity.deployed();
        campaignInstance = await Campaign.deployed();
        
    });

    console.log("Testing Charity Contract")

    // test sub-account creation
    it('Sub-account creation', async() => {
        let owner = await charityInstance.getContractOwner();
        await charityInstance.createSubAccount(accounts[2], "0x00000000000000000000000000000000000000000000000000000000466f6f64", {from: owner});
        await charityInstance.createSubAccount(accounts[3], "0x0000000000000000000000000000000000000000000000000000005761746572", {from: owner});
        await charityInstance.createSubAccount(accounts[4], "0x00000000000000000000000000000000000000000000446f6e6174696f6e0d0a", {from: owner});
        let resultantByteArray = await charityInstance.getAccountsInOrder();
        console.log(resultantByteArray);
        assert.equal(
            resultantByteArray,
            [
                '0x00000000000000000000000000000000000000000000000000000000466f6f64',
                '0x0000000000000000000000000000000000000000000000000000005761746572',
                '0x00000000000000000000000000000000000000000000446f6e6174696f6e0d0a'
            ],
            "Failed to create sub-accounts"
        );
        

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
        // truffleAssert.eventEmitted(displayAllocations, Allocation);
        // truffleAssert.eventEmitted(displayAllocations, Allocation);
    });

    //test can get CT
    it('Charity can get CT', async() => {
        let owner = await charityInstance.getContractOwner();
        let getCT = await charityInstance.getCT("100000000000000000", {from:owner});

        truffleAssert.eventEmitted(getCT, "GetCT");

        let checkCT = await charityInstance.checkCTBalance(owner);
        assert.strictEqual(checkCT.toNumber(), 10, "getCT not deployed correctly");
    });

    //test can transfer CT from charity to donor
    it('Charity can transfer CT to donor', async() => {
        let owner = await charityInstance.getContractOwner();
        let to = accounts[9];
        let sendCT = await charityInstance.transferCT(to, 10, {from:owner});

        truffleAssert.eventEmitted(sendCT, "Transfer");

        let checkCT = await charityInstance.checkCTBalance(accounts[9]);
        assert.strictEqual(checkCT.toNumber(), 10, "transferCT not deployed correctly");

    });

    //test entire donate
    it('Donors can donate', async() => {
        let donor = accounts[9];
        // let owner = await charityInstance.getContractOwner();
        let donation =  await charityInstance.donate({from:donor, value:"100000000000000000"});
        
        truffleAssert.eventEmitted(donation, "Donated");

        let checkCT = await charityInstance.checkCTBalance(donor);
        assert.strictEqual(checkCT.toNumber(), 10, "transferCTViaVote not deployed correctly");
    });

    //test can transfer CT donor to subaccount
    it('Donors can transfer CT to sub-account', async() => {
        let donor = accounts[9];
        // let owner = await charityInstance.getContractOwner();
        let sendCTviavote =  await charityInstance.transferCTViaVote(donor, accounts[1], 2, {from:donor});
        
        truffleAssert.eventEmitted(sendCTviavote, "TransferViaVote");

        let checkCT = await charityInstance.checkCTBalance(accounts[1]);
        assert.strictEqual(checkCT.toNumber(), 2, "transferCTViaVote not deployed correctly");
    });


    

    //test voting



});


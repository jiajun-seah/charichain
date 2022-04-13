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
        let o = await charityInstance.getContractOwner();
        await charityInstance.createSubAccount(accounts[2], "0x00000000000000000000000000000000000000000000000000000000466f6f64", {from: o});
        await charityInstance.createSubAccount(accounts[3], "0x0000000000000000000000000000000000000000000000000000005761746572", {from: o});
        await charityInstance.createSubAccount(accounts[4], "0x00000000000000000000000000000000000000000000446f6e6174696f6e0d0a", {from: o});
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

    //test sub-account percentages configuration
    it('Allocate sub-acount percentages', async() => {
        await charityInstance.createSubAccount(accounts[1], "0x00000000000000000000000000000000000000000000000000000000466f6f64", {from: charityInstance.getContractOwner()});
        await charityInstance.createSubAccount(accounts[2], "0x0000000000000000000000000000000000000000000000000000005761746572", {from: charityInstance.getContractOwner()});
        await charityInstance.createSubAccount(accounts[3], "0x00000000000000000000000000000000000000000000446f6e6174696f6e0d0a", {from: charityInstance.getContractOwner()});
        let resultantByteArray = await charityInstance.getAccountsInOrder();
        assert.strictEqual(
            resultantByteArray,
            ["0x00000000000000000000000000000000000000000000000000000000466f6f64",
            "0x0000000000000000000000000000000000000000000000000000005761746572",
            "0x00000000000000000000000000000000000000000000446f6e6174696f6e0d0a"],
            "Failed to create sub-accounts"
        );
    });

    //test donation

    //test processing of donations

    //test voting



});


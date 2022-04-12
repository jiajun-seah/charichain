const _deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require('truffle-assertions');
var assert = require('assert');

var Charity = artifacts.require("../contracts/Charity.sol");
var ERC20 = artifacts.require("../contracts/ERC20.sol");
var ChariToken = artifacts.require("../contracts/ChariToken.sol");
var Donor = artifacts.require("../contracts/Donor.sol");

const PREFIX = "Returned error: VM Exception while processing transaction: revert ";
const INTER =  " -- Reason given: "

contract('Charity', function(accounts) {
    before(async() => {
        charityInstance = await Charity.deployed();
        erc20Instance = await ERC20.deployed();
        chariTokenInstance = await ChariToken.deployed();
        donorInstance = await Donor.deployed();
    });

    console.log("Testing Charity Contract")

    // it('Charity creation', async() => {
    //     let makeC1 = await diceInstance.add(1, 1, {from: accounts[1], value: 1000000000000000000});
    //     assert.notStrictEqual(
    //         makeD1,
    //         undefined,
    //         "Failed to create dice"
    //     );
    // });

});


// const _deploy_contracts = require("../migrations/2_deploy_contracts");
// const truffleAssert = require('truffle-assertions');
// var assert = require('assert');

// var Charity = artifacts.require("../contracts/Charity.sol");
// var ERC20 = artifacts.require("../contracts/ERC20.sol");
// var ChariToken = artifacts.require("../contracts/ChariToken.sol");
// var Donor = artifacts.require("../contracts/Donor.sol");

// const PREFIX = "Returned error: VM Exception while processing transaction: revert ";
// const INTER =  " -- Reason given: "

// contract('Campaign', function(accounts) {
//     before(async() => {
        
//         erc20Instance = await ERC20.deployed();
//         chariTokenInstance = await ChariToken.deployed();
//         charityInstance = await Charity.deployed();
//         //donorInstance = await Donor.deployed();
//     });

//     console.log("Testing Charity Contract")

//     // create sub accounts
//     it('Create Sub Accounts', async() => {
//         let makeS1 = await charityInstance.createSubAccount(accounts[2],
//         "0x00000000000000000000000000000000000000000000000000000000466f6f64",
//         {from: charityInstance.getContractOwner()});
//         let makeS2 = await charityInstance.createSubAccount(accounts[3],
//             "0x0000000000000000000000000000000000000000000000000000005761746572",
//             {from: charityInstance.getContractOwner()});
//         assert.notStrictEqual(
//             makeS1,
//             undefined,
//             "Failed to create sub account"
//         )
//         assert.notStrictEqual(
//             makeS2,
//             undefined,
//             "Failed to create sub account"
//         )
//     });

//     // 2) allocate percentages to each sub account using allocatePercentages[]

//     //3) create campaign (make sure owner instantiates),

//     //4) Add campaign goals

//     //5) Start campaign

//     //6) Donate to a sub account. This is where I got last stuck at

// });


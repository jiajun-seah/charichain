const Charity = artifacts.require("Charity");
const ERC20 = artifacts.require("ERC20");
// const ChariToken = artifacts.require("ChariToken");
// const Donor = artifacts.require("Donor");
const Campaign = artifacts.require("Campaign");

const ethers = require('ethers')
const utils = ethers.utils



module.exports = (deployer, network, accounts) => {

  deployer.deploy(ERC20).then(function() {

    const accountList = [accounts[1], accounts[2], accounts[3]];
    const percentageList = [40, 30, 30];
    const nameList = ["0x00000000000000000000000000000000000000000000000000000000466f6f64",
    "0x0000000000000000000000000000000000000000000000000000005761746572",
    "0x00000000000000000000000000000000000000000000446f6e6174696f6e0d0a"];
    const name = utils.formatBytes32String("Save Pandas");
    deployer.deploy(Campaign, accountList, 3, percentageList, nameList, 0, name);
    
    return deployer.deploy(Charity);

  });
};
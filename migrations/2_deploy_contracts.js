const Charity = artifacts.require("Charity");
const ERC20 = artifacts.require("ERC20");
// const ChariToken = artifacts.require("ChariToken");
// const Donor = artifacts.require("Donor");
const Campaign = artifacts.require("Campaign");

module.exports = (deployer, network, accounts) => {

  deployer.deploy(ERC20).then(function() {
    return deployer.deploy(Charity);

  });
};
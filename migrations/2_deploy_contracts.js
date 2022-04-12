const Charity = artifacts.require("Charity");
const ERC20 = artifacts.require("ERC20");
const ChariToken = artifacts.require("ChariToken");
const Donor = artifacts.require("Donor");



module.exports = (deployer, network, accounts) => {
    // deployer.deploy(ERC20).then(function() {
    //   deployer.deploy(ChariToken);

    //   // const accountList = [accounts[1], accounts[2], accounts[3]];
    //   // for(let i = 0; i < 3; i++) {
    //   //   accountList.push(address[i])
    //   // }
    //   deployer.deploy(Charity);
    //   return deployer.deploy(Donor, 0, Charity, ChariToken);
    // });

    deployer.deploy(ERC20).then(function() {
      deployer.deploy(ChariToken);
      deployer.deploy(Charity);
      return deployer.deploy(Donor, 0, Charity.address, ChariToken.address);
    });
  };
const Charity = artifacts.require("Charity");
const ERC20 = artifacts.require("ERC20");
const ChariToken = artifacts.require("ChariToken");
const Donor = artifacts.require("Donor");



module.exports = (deployer, network, accounts) => {
    deployer.deploy(ERC20).then(function() {
      deployer.deploy(ChariToken);

      const accountList = [address[1], address[2], address[3]];
      // for(let i = 0; i < 3; i++) {
      //   accountList.push(address[i])
      // }
      deployer.deploy(Charity, accountList);
      return deployer.deploy(Donor, 0, Charity, ChariToken);
    });
  };
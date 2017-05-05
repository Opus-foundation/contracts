var ConvertLib = artifacts.require("./ConvertLib.sol");
var OpusCoin = artifacts.require("./OpusCoin.sol");
var SongList = artifacts.require("./SongList.sol");
module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, OpusCoin);
  deployer.deploy(OpusCoin);
  deployer.deploy(SongList);
};

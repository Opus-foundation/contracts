//TODO: display work author name
//TODO: support multiple authors with shares
// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import metacoin_artifacts from '../../build/contracts/MetaCoin.json'
//may have to take this out
//var fs = require('fs');
//const os = require('os');
//const path = require('path');
const ipfsAPI = require('ipfs-api');
var ipfs = ipfsAPI('localhost', '5001');
//

// MetaCoin is our usable abstraction, which we'll use through the code below.
var MetaCoin = contract(metacoin_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;
var workList = Array();

window.App = {
  start: function() {
    var self = this;

    // Bootstrap the MetaCoin abstraction for Use.
    MetaCoin.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];

      for(let i=0; i<accounts.length; i++){
        console.log(accounts[i]);
      }

      self.refreshBalance();
    });

    App.generateWorkList();
  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  refreshBalance: function() {
    var self = this;

    var meta;
    MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.getBalance.call(account, {from: account});
    }).then(function(value) {
      var balance_element = document.getElementById("balance");
      balance_element.innerHTML = value.valueOf();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting balance; see log.");
    });
  },

  sendCoin: function() {
    var self = this;

    var amount = parseInt(document.getElementById("amount").value);
    var receiver = document.getElementById("receiver").value;

    this.setStatus("Initiating transaction... (please wait)");

    var meta;
    MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.sendCoin(receiver, amount, {from: account});
    }).then(function() {
      self.setStatus("Transaction complete!");
      self.refreshBalance();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  },

captureFile: ()=>{
  let file = document.getElementById("file").files[0];
  var reader = new window.FileReader();
  reader.readAsArrayBuffer(file);
  reader.onloadend = function() {
    //console.log(reader.result);
  App.saveToIpfs(reader)
};

},

saveToIpfs: (reader)=>{
  //if successful, should return resource hash; if not, should return empty string

  let buffer = Buffer.from(reader.result);
  let ipfsId;
  ipfs.add(buffer)
  .then( (response)=>{
    console.log(response);
    ipfsId = response[0].hash;
    console.log(ipfsId);
    App.formlink(ipfsId);
    //return ipfsId;
    //this.setState({added_file_hash: ipfsId})
  }).catch((err) => {
    console.error(err);
  });
  //console.log("check point 1: saveToIpfs returns");
  //return ipfsId;
},

  formlink: (link)=>{
    let ref = "http://ipfs.io/ipfs/";
    ref = ref + link;
    document.getElementById("link").href = ref;
    //document.getElementById("downloadLink").href = ref;
    //document.getElementById("audioplayer").src = ref;
    return ref;
  },

  setAccount: ()=>{
    account = document.getElementById("account").value;
    App.refreshBalance();
    App.getOwnedWorks();
    App.generateWorkList();
  },

  uploadWorkToOpus: (name, price, resourceURL)=>{
    //return the id of uploaded work
    var meta;
    MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.uploadWork(name, price, resourceURL,
         {from: account});
    }).then((_id) => {
      if(id == 0){
        console.log("id == 0; upload seems to have failed!");
        return;
      }
      self.setStatus("Work uploaded to Opus!");
      //return _id;
      //self.refreshBalance();
    }).catch((e) => {
      console.log(e);
      self.setStatus("Error uploading work to OPUS; see log.");
    });
  },

  purchaseWork: (id)=>{
    var meta;
    MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.purchaseWork(id,
         {from: account});
    }).then(function() {
      self.setStatus("purchased work!");
      self.refreshBalance();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending purchasing work; see log.");
    });
  },

  playWork: (_id)=>{
    var meta;
    MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.requestURL(_id, {from: account});
    }).then((resourceURL) => {
      var _player = document.getElementById("audioplayer");
      _player.src = resourceURL;
    }).catch((e) => {
      console.log(e);
      self.setStatus("Error playing work"+_id.toString()+"; see log.");
    });
  },


  generateWork: (_id, _name, _price, _resourceURL)=>{
  //TODO: add author name
    return {
      id: _id,
      name: _name,
      price: _price,
      resourceURL: _resourceURL,
    };
  },
//The ultimate upload!!!
  uploadWorkOverall: (_name, _price)=>{
    //var _hash;
    App.captureFile().then((_hash)=>{
    if(_hash.length < 0){
      console.log("Didn't get hash...");
      return;
    }
    let _resourceURL = App.formlink(_hash);
    App.uploadAndUpdate(_name, _price, _resourceURL);
  }
  );
  },

  uploadAndUpdate: (_name, _price, _resourceURL)=>{
    App.uploadWorkToOpus(_name, _price, _resourceURL).then(
      (_id)=>{
        let uploadedId = _id;
        workUploaded = App.generateWork(uploadedId,
        name, price, resourceURL);
        workList.push(workUploaded);
        self.setStatus("Work uploaded!");
      }).catch((e)=>{
        console.log(e);
        self.setStatus("Error uploading work; see log.");
      }
    );

  },

  generateWorkList: ()=>{
    var list = document.getElementById("workList");
    list.innerHTML = "";
    for (var i=0; i<workList.length; i++){
      let _work = workList[i];
      //TODO: escape the strings
      list.innerHTML += ("<li class = 'work'> name: "+_work.name+" price: "
      + _work.price.toString() +"</li><br>" );
      list.innerHTML += ("<button onclick = 'App.playWork("+_work.id.toString()+")'>"+"play</button>");
      list.innerHTML += ("<br><button onclick = 'App.purchaseWork("+_work.id.toString()+")'>"+"purchase</button>");
    }
  },


};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  App.start();
});

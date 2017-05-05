//TODO: display work author name
//TODO: support multiple authors with shares
//TODO: check file typeo
//TODO: move database to text file
// Import the page's CSS. Webpack will know what to do with it.
// TODO: status for purchase; automatic detect web3 account change
import "../stylesheets/app.css";
const _ = require('lodash');

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';

// Import our contract artifacts and turn them into usable abstractions.
import OpusToken_artifacts from '../../build/contracts/OpusToken.json';
import work_artifacts from '../../build/contracts/Work.json';
import SongList_artifacts from '../../build/contracts/SongList.json';
import Search from './search-functions.js';
import Cookie from './cookie-functions.js';
import Utils from './utils.js';

const ipfsAPI = require('ipfs-api');
var ipfs = ipfsAPI('localhost', '5001');
//

// OpusToken is our usable abstraction, which we'll use through the code below.
var OpusToken = contract(OpusToken_artifacts);
var Pay2own = contract(work_artifacts);
var SongList = contract(SongList_artifacts);
// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;
var workList = {};
var balance = 0;

//var tokenAddress = "0xce4ca6eff00c64d212e315330cda38ed9ab86aaf";
//var songListAddress = "0x36c0f05e89fcbdd47c278f9986bd8b9a9b6d0123";
const tokenAddress = "0x4975B6e058fb146fA931Fb16fe153cF042fD34bf";
const songListAddress = "0xc1d899e1f5db52fd29cb85551b5c3483fa81a657";
const multisig = "0x41A6b259baac5C2084Bdd623F3Ac03b4cfAC3887"
const defaultImgUrl = "http://ipfs.io/ipfs/QmQtN9GCwqfjjhev5JoDi6qgWp13kbTLzQi3mgAMNCrJqs"


//console.log("cookie:");
//console.log(document.cookie);
if(Cookie.getCookie("workList")){
  workList = JSON.parse(Cookie.getCookie("workList"));
}
if(Cookie.getCookie("account")){
  account = Cookie.getCookie("account");
}
if(Cookie.getCookie("balance")){
  balance = parseFloat(Cookie.getCookie("balance"));
}


window.App = {

  start: function() {

    var self = this;

    App.loadBalance();
    App.displayFromWorkList();


    // Bootstrap the OpusToken abstraction for Use.
    OpusToken.setProvider(web3.currentProvider);
    SongList.setProvider(web3.currentProvider);
    Pay2own.setProvider(web3.currentProvider);
/*
    var songId = document.getElementById("songId").innerHTML;
    console.log(songId);
    if(songId){
      var work = workList[songId];
      if(work){
        if(work.owned){
          App.playSong(songId);
        }else{
          App.purchaseAndPlay(songId);
        }
      }
    }
*/


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
      if(accounts[0] != account){
        account = accounts[0];
        Cookie.setCookie("account", account, 2);
      }
      //console.log(accounts);
      App.loadEtherscanUrl();
      /*
      for(let i=0; i<accounts.length; i++){
        console.log(accounts[i]);
      }
      */

      //self.refreshBalance();
      //Deploy token and get back address

/*
      OpusToken.new(multisig, {from: account, gas: 4000000}).then((instance)=>{
          //console.log("from: "+account);
          console.log("token deployed");
          return instance.getContractAddress.call({from: account});
      }).then((addr)=>{
        tokenAddress = addr;
        console.log("token address: "+tokenAddress);
      }).catch((e)=>{
        console.log(e);
        App.setStatus("Problem deploying token...");
      });
      //Deploy song registry and get back address

      SongList.new({from: account, gas: 2000000}).then((instance)=>{
          console.log("from: "+account);
          console.log("songlist deployed");
          return instance.getContractAddress.call({from: account});
      }).then((addr)=>{
        songListAddress = addr;
        console.log("songList address: "+songListAddress);
      }).catch((e)=>{
        console.log(e);
        App.setStatus("Problem deploying song list...");
      });
*/

    });

    App.refreshStatus();
  },

  startCrowdsale: ()=>{
    var Opus;
    OpusToken.at(tokenAddress).then((instance)=>{
      Opus = instance;
      Opus.start({from: account});
    }).catch((e)=>{
      console.log(e);
    });
  },

  getBlocks: () => {
    var Opus;
    OpusToken.at(tokenAddress).then((instance)=>{
      Opus = instance;
      Opus.getStartBlock.call({from: account}).then((startblock)=>{
        console.log("startblock: ");
        console.log(startblock.valueOf());
      });
      Opus.getEndBlock.call({from: account}).then((startblock)=>{
        console.log("endblock: ");
        console.log(startblock.valueOf());
      });
      Opus.getCurrentBlock.call({from: account}).then((startblock)=>{
        console.log("current block: ");
        console.log(startblock.valueOf());
      });
    });
  },


  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  refreshStatus: ()=>{
    App.refreshBalance();
    App.generateSongList();
    //console.log(workList);
  },

  loadBalance: ()=>{
    var balance_element = document.getElementById("balance");
    var balance2 = document.getElementById("opusBalance");
    if(balance || balance === 0){
      balance_element.innerHTML = balance;
      balance2.innerHTML = balance;
    }
  },


  refreshBalance: function() {
    var self = this;
    var balance_element = document.getElementById("balance");
    var balance2 = document.getElementById("opusBalance");
    var Opus;
    OpusToken.at(tokenAddress).then(function(instance) {
      Opus = instance;
      return Opus.balanceOf.call(account, {from: account});
    }).then(function(value) {

      //console.log(value.valueOf());
      if(balance != web3.fromWei(value, "ether").valueOf()){
        balance = web3.fromWei(value, "ether").valueOf();
        Cookie.setCookie("balance", balance.toString(), 2);
        App.loadBalance();
      }
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting balance; see log.");
    });
  },

  sendCoin: function() {
    var self = this;

    var amount = web3.toWei(parseFloat(document.getElementById("amount").value), "ether");
    var receiver = document.getElementById("receiver").value;

    this.setStatus("Initiating transaction... (please wait)");

    var Opus;
    OpusToken.at(tokenAddress).then(function(instance) {
      Opus = instance;
      //console.log(receiver);
      //console.log(amount);
      //console.log(account);
      return Opus.transfer(receiver, amount, {from: account});
    }).then(function() {
      self.setStatus("Transaction complete!");
      self.refreshBalance();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  },

  sendEther: () =>{
    var receiver = document.getElementById("receiver").value;
    var amount = parseInt(document.getElementById("amount").value);
    var ethAmount = web3.toWei(amount, "ether")
    web3.eth.sendTransaction({ from: account, to: receiver, value: ethAmount }, (res, err)=>{
      App.refreshStatus();
    })
  },

  getSongFromAddress: (addr)=>{
    return Pay2own.at(addr);
  },

captureFile: ()=>{
  if(!App.checkFileInput("file")){
    App.setStatus("No input file found.");
    throw "no input file";
  }
  let file = document.getElementById("file").files[0];
  var reader = new window.FileReader();
  reader.readAsArrayBuffer(file);
  reader.onloadend = () => {
  App.saveToIpfs(reader)
};
},

checkTextInput: (text)=>{
  return Boolean(text);
},

checkNumInput: (num)=>{
  return (num > 0);
},

checkFileInput: (fieldname)=>{
  return (document.getElementById(fieldname).files.length > 0);
},

saveToIpfs: (reader)=>{
  //if successful, should return resource hash; if not, should return empty string
  var name = document.getElementById("name").value;
  var price = web3.toWei(document.getElementById("price").value, "ether");
  var artist = document.getElementById("artist").value;
  var img =  document.getElementById("imgUrl").value;
  var genre = document.getElementById("genre").value;
  var songInstance;
  if(!App.checkTextInput(name)){
    App.setStatus("Please enter the name of your work.");
    throw "no name entered";
  }
  if(!App.checkTextInput(artist)){
    App.setStatus("Please enter the name of your work.");
    throw "no name entered";
  }
  if(!App.checkNumInput(price)){
    App.setStatus("Please enter the price of your work.");
    throw "no price entered";
  }
  let buffer = Buffer.from(reader.result);
  let ipfsId;
  ipfs.add(buffer)
  .then( (response)=>{
    console.log(response);
    ipfsId = response[0].hash;
    console.log(ipfsId);
    if(!ipfsId){
      throw "something wrong with ipfs upload";
    }
    if(ipfsId.length == 0){
      App.setStatus("Didn't get hash...");
      throw "Didn't get hash...";
    }
    var resourceURL = App.formlink(ipfsId);
    return Pay2own.new(tokenAddress, songListAddress, name, artist, genre, resourceURL, price,
    {from: account, gas: 2000000});
  }).then((instance)=>{
    //console.log("checkpoint2");
    songInstance = instance;
    return instance.addSong({from: account});
  }).then(()=>{
    //console.log("checkpoint3");
      App.setStatus("Work uploaded!");
      //console.log("Work uploaded!");
      App.refreshStatus();
      console.log("img: "+img);
      if(img){
        songInstance.setImg(img, {from: account});
      }
    }).catch((e)=>{
      App.setStatus("Error uploading work to OPUS; see log.")
      console.log(e);
    });
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
    App.refreshStatus();
  },

  purchaseSong: (addr)=>{
    let price = workList[id].price;
    if(price > balance){
      App.setStatus("You don't have enough opus coins to purchase this song...");
      throw "insufficient balance";
    }
    App.getSongFromAddress(addr).then((instance) => {
      var price = workInstance.getPrice.call();
      return price;
    }).then((price) =>{
      OpusToken.at(tokenAddress).then((opus) => {
        return opus.transfer(addr, price, {from: account});
      });

    });
  },


  loadPlayingToPage: (_id)=>{
    var name = document.getElementById("playing-name");
    var artist = document.getElementById("playing-artist");
    var img = document.getElementById("playing-pic");
    img.src = defaultImgUrl;
    //img.display = "none";
    var _work = workList[_id];
    name.innerHTML = Utils.escapeHtml(_work.name);
    artist.innerHTML = Utils.escapeHtml(_work.artist);
    //console.log("imgUrl: "+_work.imgUrl);
    if(_work.imgUrl){

      img.src = _work.imgUrl;
      //img.display = "inline";
    }
  },

  playSong: (_id)=>{
    console.log("checkpoint1");
    console.log("localhost:8080/?songId=" + _id);
    //window.location.replace("http://google.com");

    if(!workList[_id]){
      App.setStatus("Error playing song...");
      return;
    }
    //window.location.replace("localhost:8080/?songId=" + _id);
    console.log("checkpoint2");
    App.loadPlayingToPage(_id);

    App.getSongFromAddress(_id).then(function(instance) {

      return instance.requestUrl.call({from: account});
    }).then((resourceURL) => {

      var _player = document.getElementById("audioplayer");
      _player.src = resourceURL;
    }).catch((e) => {
      console.log(e);
    });

  },

  purchaseAndPlay: (_id)=>{
    let price = workList[_id].price;
    if(price > balance){
      App.setStatus("You don't have enough opus coins to purchase this song...");
      throw "insufficient balance";
    }
    App.setStatus("Initiating transaction...(Please wait)");
    //console.log(workList);
    App.getSongFromAddress(_id).then((instance) => {
      return instance.getPrice.call();
    }).then((price) =>{
      //var _price = price;
      OpusToken.at(tokenAddress).then((opus) => {
        //console.log(_id);
        //console.log(_price);
        return opus.transfer(_id, price, {from: account});
      }).then(()=>{
        App.setStatus("Transaction complete!");
        App.refreshStatus();
        App.playSong(_id);
      }).catch((e) => {
        console.log(e);
        App.setStatus("Error purchasing song...");
      });
  })
},


  generateSong: (_id, _name, _price, _artist, _owned, _imgUrl, _genre)=>{
  //TODO: add author name
    return {
      id: _id,
      name: _name,
      price: _price,
      artist: _artist,
      owned: _owned,
      imgUrl: _imgUrl,
      genre: _genre
    };
  },

  generateSongList: ()=>{
    var yourSongs = document.getElementById("yourSongs");
    var buyMore = document.getElementById("buyMore");
    var opus;
    // First get id list
    SongList.at(songListAddress).then((instance)=>{
      //console.log("fetching the address list");
      opus = instance;
      return opus.getList.call({from: account});
  }).then((res)=>{
    console.log("got the address list");
    //yourSongs.innerHTML = "Your Songs<br>";
    //buyMore.innerHTML = "Buy more<br>";
    var ids = Array();
    for (var i=0; i<res.length; i++){
      ids.push(res[i]);
    }
    //console.log(ids);
    for (var i=0; i<ids.length; i++){
        App.getSongFromAddress(ids[i]).then((instance)=>{
          console.log("fetching song");
          return instance.getSong.call({from: account});
        }).then((res)=>{
          console.log("got song");
          let name = res[0];
          let artist = res[1];
          let price = web3.fromWei(res[2], "ether").valueOf();
          let owned = res[3];
          let _id = res[4];
          let imgUrl = res[5];
          let genre = res[6];
          var _work = App.generateSong(_id, name, price, artist, owned, imgUrl, genre);

      App.addSongToWorkList(_work);
      //App.displayFromWorkList();
    });
    }
  });
  },

  displayFromWorkList: ()=>{
    var yourSongs = document.getElementById("yourSongs");
    var buyMore = document.getElementById("buyMore");
    yourSongs.innerHTML = "Your Songs<br>";
    buyMore.innerHTML = "Buy more<br>";

    _.forIn(workList, function(value, key) {
      //console.log(value);
      var _work = value;
      //console.log(_work);
      if (_work.owned){
        var html = "";
        //console.log(_work);
        html += "<li class = \'song\' ";
        html += " onclick=\"window.location.replace(\'http://localhost/commentics/?songId=";
        html += Utils.escapeHtml(_work.id.toString()) + "\');\">";
        html += "<span class = 'song-name'>" + Utils.escapeHtml(_work.name) + "</span>";
        html += "<span class = 'song-artist'>  -"+Utils.escapeHtml(_work.artist) + "</span>";
        html += "</li>";
        yourSongs.innerHTML += html;
      }else{
        var html = "";
        //console.log(_work);
        html += "<li class = 'work' " ;
        html += " onclick=\"window.location.replace(\'http://localhost/commentics/?songId=";
        html += Utils.escapeHtml(_work.id.toString()) + "\');\">"
        html += "<span class = 'song-name'>" + Utils.escapeHtml(_work.name) + "</span>";
        html += "<span class = 'song-artist'>  -"+Utils.escapeHtml(_work.artist) + "</span>";
        html += "<span class = 'song-price'>" + "      price: ";
        html += Utils.escapeHtml(_work.price.toString()) + " opus</span>";
        html += "</li>";
        buyMore.innerHTML += html;
      }
    });
  },

  addSongToWorkList: (_work) =>{

    var original = workList[_work.id];
    if(!_.isEqual(original, _work)){
      console.log("updating worklist"+_work.id);
      workList[_work.id] = _work;
      App.displayFromWorkList();
      App.saveWorkList2Cookie();
    }
    //console.log(workList);
  },

  saveWorkList2Cookie: () => {
    var s = JSON.stringify(workList);
    //console.log("workList string: "+s);
    Cookie.setCookie("workList", s, 2);
  },

  generateEtherscanUrl: ()=>{
    var url = "https://ropsten.etherscan.io/token/" + Utils.escapeHtml(tokenAddress);
    if(account){
      url += "?a=" + Utils.escapeHtml(account);
    }
    return url;
  },

  loadEtherscanUrl: ()=>{
    var html = document.getElementById("etherscanUrl");
    html.href = App.generateEtherscanUrl();
  },

  requestEther: ()=>{
    if(!account){
      App.setStatus("Account not found. Please install Metamask plugin and login or use Mist browser.");
      return;
    }
    App.setStatus("Sending request to faucet, please wait...");
    var request = new XMLHttpRequest();
    request.onreadystatechange= () => {
        if (request.readyState==4) {

            App.refreshStatus();
            console.log(request.responseText);
            var res = JSON.parse(request.responseText);
            if (res["txHash"]){
              App.setStatus("Request accepted. You can check ether balance after about 15 seconds.");
            }else{
              App.setStatus("Request rejected; please wait for a minute and try again.");
            }

    }};
    request.open("POST", "https://ropsten.faucet.b9lab.com/tap", true);
    request.setRequestHeader("Content-Type", "application/json");
    //request.setRequestHeader("Accept","text/plain");
    var data = "{\"toWhom\":\"" + account + "\"}";
    //console.log(data);
    request.send(data);

  },

  search: () => {
    var text = document.getElementById("search-bar").value;
    var result = Search.search(text, workList);
    //console.log(result);
    App.loadSearchResults(result);
  },

  loadSearchResults: (result) => {
    var searchResults = document.getElementById("search-results");
    searchResults.innerHTML = "";

    _.forIn(result, function(value, key) {
      //console.log(value);
      var _work = value;
      //console.log(_work);
      if (_work.owned){
        var html = "";
        //console.log(_work);
        html += `<li class="elementHorizontal">
          <div class="elementHorizontal">
            <img src="img/cover.png" alt="cover" class="cover">
            <div class="elementVertical">
              <span class="title">`
        html += Utils.escapeHtml(_work.name);
        html += "</span><span>"
        html += Utils.escapeHtml(_work.artist);
        html += `</span>
            </div>
          </div>
          <div class="elementHorizontal">
            <span><i class="ico playCircle" style = "cursor: pointer" `;
        html += "";
        html += `></i>Play</span>
            <span>|</span>
            <span>Buy this song<i class="ico ocGray"></i> 10</span>
          </div>
        </li>`;
      }else{
        var html = "";
        //console.log(_work);
        html += "<li class = 'work' " ;
        html += " onclick=\"App.purchaseAndPlay(\'";
        html += Utils.escapeHtml(_work.id.toString()) + "\');\">"
        html += "<span class = 'song-name'>" + Utils.escapeHtml(_work.name) + "</span>";
        html += "<span class = 'song-artist'>  -"+Utils.escapeHtml(_work.artist) + "</span>";
        html += "<span class = 'song-price'>" + "      price: ";
        html += Utils.escapeHtml(_work.price.toString()) + " opus</span>";
        html += "</li>";
        searchResults.innerHTML += html;
      }
    });
  },

};



window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/OpusMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 OpusToken, ensure you've configured that source properly. If using OpusMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-Opusmask")
    // Use Mist/OpusMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    //console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Opusmask for development. More info here: http://truffleframework.com/tutorials/truffle-and-Opusmask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    //window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    App.setStatus("Please install the Opusmask chrome plugin, or open this demo in the Mist browser.");
  }

  var audio = document.getElementById("audioplayer");
  audio.addEventListener("timeupdate", function() {
    var timeleft = document.getElementById('timeleft'),
        duration = parseInt( audio.duration ),
        currentTime = parseInt( audio.currentTime ),
        timeLeft = duration - currentTime,
        s, m;


    s = timeLeft % 60;
    m = Math.floor( timeLeft / 60 ) % 60;

    s = s < 10 ? "0"+s : s;
    m = m < 10 ? "0"+m : m;

    timeleft.innerHTML = m+":"+s;

}, false);

  App.start();
});

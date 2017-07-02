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
import Album_artifacts from '../../build/contracts/Album.json';
import AlbumList_artifacts from '../../build/contracts/AlbumList.json';
import Search from './search-functions.js';
import Cookie from './cookie-functions.js';
import Utils from './utils.js';
import AudioControl from './audio-control.js';
import Tip from './tips.js';
import Constants from './constants.js';
import Albums from './albums.js';
const ipfsAPI = require('ipfs-api');
var ipfs = ipfsAPI('localhost', '5001');
//

// OpusToken is our usable abstraction, which we'll use through the code below.
var OpusToken = contract(OpusToken_artifacts);
var Pay2own = contract(work_artifacts);
var SongList = contract(SongList_artifacts);
var AlbumInterface = contract(Album_artifacts);
var AlbumList = contract(AlbumList_artifacts);
// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;
var workList = {};
var balance = 0;
var workArray = Array();
var currentPlayIndex = 0;
var albumList = {};
var album2Songs = {};
var currentAlbum = "";
//var tokenAddress = "0xce4ca6eff00c64d212e315330cda38ed9ab86aaf";
//var songListAddress = "0x36c0f05e89fcbdd47c278f9986bd8b9a9b6d0123";
const tokenAddress = Constants.tokenAddress;
const songListAddress = Constants.songListAddress;
const multisig = Constants.multisig;
const defaultImgUrl = "http://ipfs.io/ipfs/QmQtN9GCwqfjjhev5JoDi6qgWp13kbTLzQi3mgAMNCrJqs"


//console.log("cookie:");
//console.log(document.cookie);
if(Cookie.getCookie("opusAdvanced-workList")){
  workList = JSON.parse(Cookie.getCookie("opusAdvanced-workList"));
}
if(Cookie.getCookie("opusAdvanced-account")){
  account = Cookie.getCookie("opusAdvanced-account");
}
if(Cookie.getCookie("opusAdvanced-balance")){
  balance = parseFloat(Cookie.getCookie("opusAdvanced-balance"));
}

if(Cookie.getCookie("opusAdvanced-albumList")){
  albumList = JSON.parse(Cookie.getCookie("opusAdvanced-albumList"));
}

if(Cookie.getCookie("opusAdvanced-album2Songs")){
  album2Songs = JSON.parse(Cookie.getCookie("opusAdvanced-album2Songs"));
}

window.App = {
  ms_viewAll: false,

  bs_viewAll: false,

  start: function() {



    var self = this;

    App.loadBalance();
    App.displayFromWorkList();
    Albums.displayFromAlbumList(albumList, workList);
    App.loadAccount();

    // Bootstrap the OpusToken abstraction for Use.
    OpusToken.setProvider(web3.currentProvider);
    SongList.setProvider(web3.currentProvider);
    Pay2own.setProvider(web3.currentProvider);
    AlbumInterface.setProvider(web3.currentProvider);
    AlbumList.setProvider(web3.currentProvider);

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
        Cookie.setCookie("opusAdvanced-account", account, 2);
        App.loadAccount();
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

      //Deploy song registry and get back address


*/

    });

    App.refreshStatus();
  },

  createToken: ()=>{
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
  },

  createSongList: ()=>{
    SongList.new({from: account, gas: 2000000}).then((instance)=>{
        console.log("from: "+account);
        console.log("songlist deployed");
        return instance.getContractAddress.call({from: account});
    }).then((addr)=>{
      console.log("songList address: "+addr);
    }).catch((e)=>{
      console.log(e);
      App.setStatus("Problem deploying song list...");
    });
  },

  createAlbumList: ()=>{
    Albums.createAlbumList(AlbumList,account);
  },


  createAlbum: ()=>{
    var name = document.getElementById("name").value;
    var price = web3.toWei(document.getElementById("price").value, "ether");
    var artist = document.getElementById("artist").value;
    var img =  document.getElementById("imgUrl").value;
    Albums.createAlbum(name, artist, price, tokenAddress, Constants.albumListAddress, img,
      account, AlbumInterface);

  },

  addSong2Album: ()=>{
    var song = document.getElementById("contract-address1").value;
    var album = document.getElementById("contract-address2").value;
    Albums.addSong(song, album, Pay2own, account);
  },

  generateAlbumList: ()=>{
    Albums.generateAlbumList(AlbumList, workList, AlbumInterface, albumList,
      album2Songs, account);
  },

  toggleSongsList: (id)=>{
    Albums.toggleSongsList(id);
  },

  purchaseAlbum: (_id)=>{
    var price = parseInt(albumList[_id].price);
    console.log("album price"+price);
    if(price > balance){
      App.setStatus("You don't have enough opus coins to purchase this album...");
      throw "insufficient balance";
    }
    App.setStatus("Initiating transaction, please wait. After confirmation, transactions typically take 15s to process.");
    //console.log(workList);

      OpusToken.at(tokenAddress).then((opus) => {
        //console.log(_id);
        //console.log(_price);
        return opus.transfer(_id, price, {from: account});
      }).then(()=>{
        App.setStatus("Transaction complete!");
        App.refreshStatus();
      }).catch((e)=>{
        console.log(e);
      });
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
    Tip.setStatus(message);
  },

  nextTip: ()=>{
    Tip.next();
  },

  hideTips: ()=>{
    Tip.hide();
  },

  refreshStatus: ()=>{
    App.refreshBalance();
    App.generateSongList();
    App.generateAlbumList();
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

  loadAccount: ()=>{
    var account_element = document.getElementById("account");
    if(account){
      account_element.innerHTML = account;
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
        Cookie.setCookie("opusAdvanced-balance", balance.toString(), 2);
        App.loadBalance();
      }
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting balance; please make sure you have installed and logged in your wallet.");
    });
  },

  sendCoin: function() {
    var self = this;

    var amount = web3.toWei(parseFloat(document.getElementById("amount").value), "ether");
    var receiver = document.getElementById("receiver").value;

    this.setStatus("Initiating transaction, please wait. After confirmation, transactions typically take 15s to process.");

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

      App.setStatus("Error sending tokens; please make sure that you have installed and logged into your wallet.");
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
  //var genre = document.getElementById("genre").value;
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
    return Pay2own.new(tokenAddress, songListAddress, name, artist, img, resourceURL, price,
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
      App.setStatus(`You don't have enough opus coins to purchase this song. <a
      style="cursor:pointer" onclick="App.requestToken()">request demo tokens</a>`);
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
    var name1 = document.getElementById("player-title1");
    var name2 = document.getElementById("player-title2");
    var artist1 = document.getElementById("player-artist1");
    var artist2 = document.getElementById("player-artist2");
    //var img = document.getElementById("playing-pic");
    //img.src = defaultImgUrl;
    //img.display = "none";
    var _work = workList[_id];
    name1.innerHTML = Utils.escapeHtml(_work.name);
    name2.innerHTML = Utils.escapeHtml(_work.name);
    artist1.innerHTML = Utils.escapeHtml(_work.artist);
    artist2.innerHTML = Utils.escapeHtml(_work.artist);
    //console.log("imgUrl: "+_work.imgUrl);
    if(_work.imgUrl){

      //img.src = _work.imgUrl;
      //img.display = "inline";
    }
    AudioControl.renderPlayProgress(0);

  },

  playSong: (_id)=>{
    //console.log("checkpoint1");
    //console.log("localhost:8080/?songId=" + _id);
    //window.location.replace("http://google.com");
    console.log(workArray);
    if(!workList[_id]){
      console.log("problem with id");
      //App.setStatus("Error playing song...");
      return;
    }
    if(!workList[_id].owned){
      App.setStatus("Please first purchase this song.");
      return;
    }
    //window.location.replace("localhost:8080/?songId=" + _id);
    console.log("checkpoint2");
    App.loadPlayingToPage(_id);
    currentPlayIndex = App.findPlayIndex(_id);

    App.getSongFromAddress(_id).then(function(instance) {

      return instance.requestUrl.call({from: account});
    }).then((resourceURL) => {

      var _player = document.getElementById("audioplayer");
      _player.src = resourceURL;
      AudioControl.playAudio();
    }).catch((e) => {
      console.log(e);
    });

  },

  findPlayIndex: (id)=>{
    for(var i=0; i<workArray.length; i++){
      if(workArray[i].id == id){
        return i;
      }
    }
    return 0;
  },

  nextId: ()=>{
    if(!workArray.length){
      return "";
    }
    if(AudioControl.random){
      index = Math.floor(Math.random() * workArray.length);
      if(index >= workArray.length){
        return workArray[0].id;
      }
      return workArray[index].id;
    }else{
      var index = currentPlayIndex + 1;
      if(index >= workArray.length){
        return workArray[0].id;
      }
      return workArray[index].id;
    }
  },

  prevId: ()=>{
    if(!workArray.length){
      return "";
    }
    var index = currentPlayIndex - 1;
    if(index < 0){
      return workArray[workArray.length - 1].id;
    }
    return workArray[index].id;
  },

  playAudio: () => {
    AudioControl.playAudio();
  },

  playNext: () => {
    var id = App.nextId();
    if (!id){
      return;
    }
    App.playSong(id);
  },

  playPrev:  () => {
    var id = App.prevId();
    if (!id){
      return;
    }
    App.playSong(id);
  },

  toggleLoop: ()=>{
    AudioControl.toggleLoop();
  },

  toggleRandom: ()=>{
    AudioControl.toggleRandom();
  },

  purchaseAndPlay: (_id)=>{
    let price = parseInt(workList[_id].price);
    if(price > balance){
      App.setStatus("You don't have enough opus coins to purchase this song...");
      throw "insufficient balance";
    }
    App.setStatus("Initiating transaction, please wait. After confirmation, transactions typically take 15s to process.");
    //console.log(workList);
    App.getSongFromAddress(_id).then((instance) => {
      return instance.getPrice.call();
    }).then((price) =>{
      //var _price = price;
      console.log("purchasing: ");
      console.log(price.valueOf());
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
        App.setStatus("Error purchasing song; please");
      });
  })
},


  generateSong: (_id, _name, _price, _artist, _owned, _imgUrl)=>{
  //TODO: add author name
    return {
      id: _id,
      name: _name,
      price: _price,
      artist: _artist,
      owned: _owned,
      imgUrl: _imgUrl,
    };
  },

  generateSongList: ()=>{
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
          //let genre = res[6];
          var _work = App.generateSong(_id, name, price, artist, owned, imgUrl);
          console.log(_work);
      App.addSongToWorkList(_work);
      //App.displayFromWorkList();
    });
    }
  });
  },

  displayFromWorkList: ()=>{
    App.workArrayFromList();
    var yourSongs = document.getElementById("ms");
    var buyMore = document.getElementById("bs");
    yourSongs.innerHTML = `<div class="panel-header elementHorizontal">
        <h5>My songs</h5>
        <a style="cursor:pointer" onclick="App.toggleMsViewAll()" >view all</a>
        </div>`;
    buyMore.innerHTML = `<div class="panel-header elementHorizontal">
        <h5>Buy songs</h5>
        <a style="cursor:pointer" onclick="App.toggleBsViewAll()" >view all</a>
        </div>`;
    var yourSongCount = 0;
    var buyMoreCount = 0;
    _.forIn(workList, function(value, key) {
      console.log(value);
      var _work = value;
      //console.log(_work);
      if (_work.owned){

        var html = "";
        //console.log(_work);
        html += `  <div class="elementHorizontal songElement"> <!-- Start Element -->
            <div class="elementHorizontal">`
              //<span class="number">`
        //html += '0' + yourSongCount.toString();
        //html += `</span>
        html +=   `<img src="` + _work.imgUrl;
        html += `" alt="cover" class="cover">
              <div class="elementVertical">
                <span class="title">`
        html += _work.name;
        html += `</span>
                <span>`
        html += _work.artist;
        html += `</span>
                <span><i class="ico playCircle" style="cursor: pointer" `;
        html += "onclick = 'App.playSong(\"" + Utils.escapeHtml(_work.id) + "\");'";
        html += `></i>HQ</span>
              </div>
            </div>
            <div class="elementVertical">
              <div class="elementHorizontal hideOnSmall">
                <span><i class="ico playCircle" style="cursor: pointer" `;
        html += "onclick = 'App.playSong(\"" + Utils.escapeHtml(_work.id) + "\");'";
        html += `></i>36k</span>
                <span><i class="ico heartPlus"></i>3k</span>`
                //<span><i class="ico share"></i>352</span>
                //<span><i class="ico comment"></i>84</span>
        html += `    </div>
            </div> </div>`;
        if(yourSongCount+1 > 3 && !App.ms_viewAll){
          return;
        }
        yourSongs.innerHTML += html;
        yourSongCount += 1;
      }else{

        var html = "";
        //console.log(_work);
        html += `  <div class="elementHorizontal songElement"> <!-- Start Element -->
            <div class="elementHorizontal">`
              //<span class="number">`
        //html += '0' + buyMoreCount.toString();
        //html += `</span>
        html +=   `<img src="` + _work.imgUrl;
        html += `" alt="cover" class="cover">
              <div class="elementVertical">
                <span class="title">`
        html += _work.name;
        html += `</span>
                <span>`
        html += _work.artist;
        html += `</span>
                <span><i class="ico playCircle" style="cursor: pointer" `;
        html += "onclick = 'App.purchaseAndPlay(\"" + Utils.escapeHtml(_work.id) + "\");'";
        html += `></i>3:32</span>
              </div>
            </div>`
        html += `   <div class="elementVertical detail">
              <div class="elementHorizontal">
                <span><i class="ico ocGray"></i>`
        html += _work.price;
        console.log("price: "+_work.price);
        html += `</span>
                <a href="#" `
        html += "onclick = 'App.purchaseAndPlay(\"" + Utils.escapeHtml(_work.id) + "\");'";
        html += `> <i class="ico playCircleWhite" ></i> Buy this song</a>
              </div>
            </div> </div>`
        if(buyMoreCount+1 > 3 && !App.bs_viewAll){
          return;
        }
        buyMore.innerHTML += html;
        buyMoreCount += 1;
      }

    });
    buyMore.innerHTML += `<div class="elementVertical alignCenter border-bottom"><a class="viewAll red"
    style="cursor: pointer" onclick="App.requestToken()"><i class="ico oc"></i>
    Request OPUS demo tokens</a></div>
    <div class="elementVertical alignCenter"><a class="viewAll" style="cursor: pointer"
    onclick="App.requestEther()">Request Ether</a></div>
    `;
  },

  toggleMsViewAll: ()=>{
    if(App.ms_viewAll){
      App.ms_viewAll = false;
      App.displayFromWorkList();
    }else{
      App.ms_viewAll = true;
      App.displayFromWorkList();
    }
  },

  toggleBsViewAll: ()=>{
    if(App.bs_viewAll){
      App.bs_viewAll = false;
      App.displayFromWorkList();
    }else{
      App.bs_viewAll = true;
      App.displayFromWorkList();
    }
  },

  workArrayFromList: ()=>{
    workArray = Array();
    _.forIn(workList, (value, key) => {
      var work = value;
      if(work.owned){
        workArray.push(work);
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
    Cookie.setCookie("opusAdvanced-workList", s, 2);
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

  requestToken: ()=>{
    if(!account){
      App.setStatus("Account not found. Please install Metamask plugin and login or use Mist browser.");
      return;
    }
    var Opus;
    OpusToken.at(tokenAddress).then((instance)=>{
      Opus = instance;
      App.setStatus("Requesting tokens...Please wait, transactions typically take about 15s to process.");
      return Opus.requestToken({from: account});
    }).then(()=>{
      App.refreshBalance();
      App.setStatus("Transaction complete!");
    }).catch((e)=>{
      console.log(e);
      App.setStatus("Error requesting tokens. Please make sure you have installed and logged in your wallet.");

    });

  },

  search: () => {
    var text = document.getElementById("search-input").value;
    var result = Search.search(text, workList);
    console.log(result);
    //console.log(result);
    App.loadSearchResults(result);
  },

  loadSearchResults: (result) => {
    var searchResults = document.getElementById("searchResults");
    searchResults.innerHTML = "";
    console.log("display starts:");
    _.forIn(result, function(value, key) {
      console.log("displaying search result: "+value);
      //console.log(value);
      var _work = value;
      //console.log(_work);
      if (_work.owned){
        var html = "";
        //console.log(_work);
        html += `<li class="elementHorizontal">
          <div class="elementHorizontal">
            <img src="` + _work.imgUrl;
        html += `" alt="cover" class="cover">
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
        html += "onclick = 'App.playSong(\"" + Utils.escapeHtml(_work.id) + "\");'";
        html += `></i>Play</span>
             `
        html += `
          </div>
        </li>`;
        searchResults.innerHTML += html;
      }else{
        var html = "";
        //console.log(_work);
        html += `<li class="elementHorizontal">
          <div class="elementHorizontal">
            <img src="` + _work.imgUrl;
        html += `img/cover.png" alt="cover" class="cover">
            <div class="elementVertical">
              <span class="title">`
        html += Utils.escapeHtml(_work.name);
        html += "</span><span>"
        html += Utils.escapeHtml(_work.artist);
        html += `</span>
            </div>
          </div>
          <div class="elementHorizontal">
            `;

        html +=   "<span style=\"cursor: pointer\" ";
        html += "onclick = 'App.purchaseAndPlay(\"" + Utils.escapeHtml(_work.id) + "\");'";
        html += `>Buy this song<i class="ico ocGray"></i> `
        html += Utils.escapeHtml(_work.price);
        html += `</span>
          </div>
        </li>`;
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
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    App.setStatus("Please install the Opusmask chrome plugin, or open this demo in the Mist browser.");
  }

  var audio = document.getElementById("audioplayer");
  audio.addEventListener("timeupdate", function() {

    //var timeleft = document.getElementById('timeleft'),
        duration = parseInt( audio.duration ),
        currentTime = parseInt( audio.currentTime ),
        timeLeft = duration - currentTime,
        s, m;



    //timeleft.innerHTML = AudioControl.timeText(timeLeft);
    var playPercent = 100 * (audio.currentTime / duration);
    AudioControl.renderPlayProgress(playPercent);

}, false);


    audio.addEventListener('canplaythrough', function() {
       window.changeTime(AudioControl.timeText(parseInt( audio.duration )));
    }, false);
    audio.addEventListener('ended', function() {
      var pButton1 = document.getElementById('playButton');
      var pButton2 = document.getElementById('float-playButton');
      pButton1.className = "ico play";
      pButton2.className = "ico play";
    }, false);

  App.start();
});

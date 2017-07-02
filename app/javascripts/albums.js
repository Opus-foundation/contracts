import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';
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






var Albums = {


  albumList: {},
  createAlbum: (title, artist, price, token, list, img, account, AlbumInterface)=>{
    var album;
    AlbumInterface.new(title, artist, price, token, list,
      img, {from: account, gas: 4000000}).then((instance)=>{
      console.log("album created");
      album = instance;
      return instance.getContractAddress.call({from: account});
    }).then((addr)=>{
      console.log("album address: "+addr);
      return album.addAlbum({from: account});
    }).then(()=>{
      console.log("album added to list!");
    }).catch((e)=>{
      console.log(e);
    });
  },

  createAlbumList: (AlbumList, account)=>{
    AlbumList.new({from: account, gas: 2000000}).then((instance)=>{
        console.log("from: "+account);
        console.log("albumlist deployed");
        return instance.getContractAddress.call({from: account});
    }).then((addr)=>{
      console.log("albumList address: "+addr);
    }).catch((e)=>{
      console.log(e);
      App.setStatus("Problem deploying album list...");
    });
  },

  addSong: (song, album, Pay2own, account)=>{
    Pay2own.at(song).then((instance)=>{
      return instance.addToAlbum(album, {from: account});
    }).then(()=>{
      console.log("song added to album!");
    }).catch((e)=>{
      console.log(e);
    });
  },

  generateAlbumList: (AlbumList, workList, AlbumInterface, albumList, album2Songs, account)=>{
    console.log("generating album list!");
    console.log("workList: "+workList);
    var opus;
    // First get id list
    AlbumList.at(Constants.albumListAddress).then((instance)=>{
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
        AlbumInterface.at(ids[i]).then((instance)=>{
          console.log("fetching album");

          return instance.getAlbum.call({from: account});
        }).then((res)=>{
          console.log("got album:");
          let name = res[0];
          let artist = res[1];
          let price = web3.fromWei(res[2], "ether").valueOf();
          let owned = res[3];
          let _id = res[4];
          let imgUrl = res[5];
          let songs = res[6];
          var _work = Albums.generateAlbum(_id, name, price, artist, owned, imgUrl, songs);
          console.log(_work);
          /*
          AlbumInterface.at(_id).then((instance)=>{
            return instance.getSongs.call({from: account});
          }).then((songs)=>{
            //console.log("first song in album:"+songs[0]);
            Albums.generateAlbum2Songs(songs, album2Songs);
          }).catch((e)=>{
            console.log(e);
          });
          */
      Albums.addAlbumToList(_work, albumList);
      Albums.displayFromAlbumList(albumList, workList);
      //App.displayFromWorkList();

    });
    }
  });
  },

  generateAlbum: (_id, _name, _price, _artist, _owned, _imgUrl, _songs)=>{

    return {
      id: _id,
      name: _name,
      price: _price,
      artist: _artist,
      owned: _owned,
      imgUrl: _imgUrl,
      songs: _songs
    };
  },

  generateAlbum2Songs: (songs, )=>{

  },

  saveAlbum2Songs2Cookie: ()=>{

  },

  saveAlbumList2Cookie: (albumList) => {
    var s = JSON.stringify(albumList);
    //console.log("workList string: "+s);
    Cookie.setCookie("opusAdvanced-albumList", s, 2);
  },

  addAlbumToList: (_work, albumList) =>{

    var original = albumList[_work.id];
    if(!_.isEqual(original, _work)){
      console.log("updating albumlist"+_work.id);
      albumList[_work.id] = _work;
      //Albums.displayFromAlbumList(albumList);
      Albums.saveAlbumList2Cookie(albumList);
    }

    //console.log(workList);
  },

  displayFromAlbumList: (albumList, workList)=>{
    console.log("displaying album list!");
    console.log("workList: "+workList);
    var element = document.getElementById("albums");
    element.innerHTML = "";
    var albumCount = 1;
    _.forIn(albumList, (value,key)=>{
      var _work = value;
      console.log("displaying album: "+_work);
      var html = "";
      //console.log(_work);
      html += `  <div class="elementHorizontal songElement"
      onclick="App.toggleSongsList('`;
      //html += "songList"+_work.id;
      html += _work.id;
      html += `')"> <!-- Start Element -->
          <div class="elementHorizontal">
            <span class="number">`
      html += '0' + albumCount.toString();
      html += `</span>
      <img src="`
      html += _work.imgUrl;
      html += `" alt="cover" class="cover">
            <div class="elementVertical">
              <span class="title">`
      html += _work.name;
      html += `</span>
              <span>`
      html += _work.artist;
      html += `</span>

            </div>
          </div>`
      html += `   <div class="elementVertical detail">
            <div class="elementHorizontal">
              <span><i class="ico ocGray"></i>`
      html += _work.price;
      console.log("price: "+_work.price);
      html += `</span>`
      if(!_work.owned){
        html +=        `<a style="cursor: pointer" `
        html += "onclick = 'App.purchaseAlbum(\"" + Utils.escapeHtml(_work.id) + "\");'";
        html += `> <i class="ico playCircleWhite" ></i> Buy this album</a>`
      }
      html += `</div>
          </div> </div>`;
      html += '<div class="songsList" id="songsList' + _work.id + '">';
      //html += '<div class="songsList" id="songList01">';
      html += "</div>"
      element.innerHTML += html;
      console.log("songs: "+_work.songs);
      var songListElement = document.getElementById("songsList"+_work.id);
      //var songListElement = document.getElementById("songList01");
      songListElement.innerHTML = "";
      var html = "";
      for(var i=0; i<_work.songs.length; i++){
        html += Albums.displaySongElement(_work.songs[i], workList);
      }
      songListElement.innerHTML += html;

      albumCount += 1;
    });
  },

  displaySongElement: (id,  workList)=>{
    var _work = workList[id];
    if(!_work){
      return "";
    }
    var html = "";
    html += `  <div class="elementHorizontal songElement"  > <!-- Start Element -->
        <div class="elementHorizontal">
          `
    html += `<img src="`
    html += _work.imgUrl;
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
    html += `></i>HQ</span>`
    html += `

          </div>
        </div>`
    html += `   <div class="elementVertical detail">
          <div class="elementHorizontal">
            <span><i class="ico ocGray"></i>`
    html += _work.price;
    console.log("price: "+_work.price);
    html += `</span>`
    if(!_work.owned){
      html +=        `<a style="cursor: pointer" `
      html += "onclick = 'App.purchaseAndPlay(\"" + Utils.escapeHtml(_work.id) + "\");'";
      html += `> <i class="ico playCircleWhite" ></i> Buy this song</a>`
    }else{
      html += `<span><i class="ico playCircle" style="cursor: pointer" `;
      html += "onclick = 'App.playSong(\"" + Utils.escapeHtml(_work.id) + "\");'";
      html += `></i>36k</span>
      <span><i class="ico heartPlus"></i>3k</span>`
      html +=        `<a style="cursor: pointer" `
      html += "onclick = 'App.playSong(\"" + Utils.escapeHtml(_work.id) + "\");'";
      html += `> <i class="ico playCircleWhite" ></i> Play</a>`
    }
    html += `
          </div>
        </div> </div>`;
    return html;
  },

  toggleSongsList: (id)=>{
    console.log("toggling songslist!");
    var element = document.getElementById("songsList"+id);
    console.log("class: " + element.className);
    if (element.className.includes("opened")){

      element.className = "songsList";
    }else{
      element.className = "songsList opened";
    }
  },
}

export default Albums;

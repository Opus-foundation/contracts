const _ = require('lodash');
const AudioControl = {
  random: false,
  playAudio: () => {
    var music = document.getElementById('audioplayer');
    var pButton1 = document.getElementById('playButton');
    var pButton2 = document.getElementById('float-playButton');
  	if (music.paused) {
  		music.play();
  		//pButton.className = "";
  		pButton1.className = "ico pause";
      pButton2.className = "ico pause";
  	} else {
  		music.pause();
  		//pButton.className = "";
  		//pButton.className = "play";
      pButton1.className = "ico play";
      pButton2.className = "ico play";
  	}
  },

  toggleLoop: ()=>{
    var music = document.getElementById('audioplayer');
    var icons = document.getElementsByClassName("ico repeat");
    if(!icons){
      icons = document.getElementsByClassName("ico repeat active");
    }
    console.log(icons);
    if(music.loop){
      music.loop = false;
      _.forEach(icons, (value, key)=>{
        console.log(value);
        value.className = "ico repeat";
      });
      console.log("loop off");
    }else{
      music.loop = true;
      _.forEach(icons, (value, key)=>{
        console.log(value);
        value.className = "ico repeat active";
      });
      console.log("loop on");
    }
  },

  toggleRandom: ()=>{
    var music = document.getElementById('audioplayer');
    var icons = document.getElementsByClassName("ico random");
    if(!icons){
      icons = document.getElementsByClassName("ico random active");
    }
    console.log(icons);
    if(AudioControl.random){
      AudioControl.random = false;
      _.forEach(icons, (value, key)=>{
        console.log(value);
        value.className = "ico random";
      });
      console.log("random off");
    }else{
      AudioControl.random = true;
      _.forEach(icons, (value, key)=>{
        console.log(value);
        value.className = "ico random active";
      });
      console.log("random on");
    }
  },

  renderPlayProgress: (playPercent)=>{
    var playhead = document.getElementById("progress");
    var playhead2 = document.getElementById("s-progress");
    var playheadFloat = document.getElementById("float-progress");
    playhead.style.marginLeft = playPercent + "%";
    playhead2.style.width = playPercent + "%";
    playheadFloat.style.width = playPercent + "%";
  },

  timeText: (seconds)=>{
    var s, m;
    s = seconds % 60;
    m = Math.floor( seconds / 60 ) % 60;

    s = s < 10 ? "0"+s : s;
    m = m < 10 ? "0"+m : m;

    return m+":"+s;
  },

};

export default AudioControl;

const AudioControl = {

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


};

export default AudioControl;

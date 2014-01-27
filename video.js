function takephoto(){
   var canvas = document.createElement('canvas');
   canvas.width = 640;
   canvas.height = 480;
   context = canvas.getContext("2d");
   context.drawImage(video, 0, 0, 640, 480);
   return canvas;
}

window.addEventListener("DOMContentLoaded", function() {
   // Grab elements, create settings, etc.
   var video = document.getElementById("video"),
      videoObj = { "video": true },
      errBack = function(error) {
         console.log("Video capture error: ", error.code); 
      };

   // Put video listeners into place
   if(navigator.getUserMedia) { // Standard
      navigator.getUserMedia(videoObj, function(stream) {
         video.src = stream;
         video.play();
      }, errBack);
   } else if(navigator.webkitGetUserMedia) { // WebKit-prefixed
      navigator.webkitGetUserMedia(videoObj, function(stream){
         video.src = window.webkitURL.createObjectURL(stream);
         video.play();
      }, errBack);
   }
   else if(navigator.mozGetUserMedia) { // Firefox-prefixed
      navigator.mozGetUserMedia(videoObj, function(stream){
         video.src = window.URL.createObjectURL(stream);
         video.play();
      }, errBack);
   }

}, false);

function next(a, b, id){
   document.getElementById(a).style.display = 'none';

   b = document.getElementById(b);

   if(b){
      b.style.display = 'block';
   }else{
      init();
      //toggletheme();
   }

   if(id){
      document.getElementById(id).appendChild(takephoto())
   }
};

//init();

var theme = new Howl({
  urls: ['sound/theme.mp3'],
  volume: 0.5,
  loop: true
});

sfx = {
   pop: new Howl({ urls: ['sound/pop.mp3'] }),
   cup: new Howl({ urls: ['sound/cup.mp3'] }),
   stir: new Howl({ urls: ['sound/stir.mp3'] }),
   collect: new Howl({ urls: ['sound/collect.mp3'] }),
   no: new Howl({ urls: ['sound/no.mp3'] }),
   plate: new Howl({ urls: ['sound/plate.mp3'] })
};

function toggletheme(){
  playtheme = !playtheme;

  if(playtheme){
    theme.play();
  }else{
    theme.stop();
  }

}


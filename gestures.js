(function() {
  function calibrate() {
    wasdown = {
      x: down.x,
      y: down.y,
      d: down.d
    };
  }

  function handledown() {
    avg = 0.9 * avg + 0.1 * down.d;
    var davg = down.d - avg, good = davg > brightthresh;
    //console.log(davg)
    switch (state) {
      case 0:
        if (good) {//Found a gesture, waiting for next move
          state = 1;
          calibrate();
        }
        break;
      case 2://Wait for gesture to end
        if (!good) {//Gesture ended
          state = 0;
        }
        break;
      case 1://Got next move, do something based on direction
        var dx = down.x - wasdown.x, dy = down.y - wasdown.y;
        var dirx = Math.abs(dy) < Math.abs(dx);//(dx,dy) is on a bowtie
        //console.log(good,davg)
        if (dx < -movethresh && dirx) {
          console.log('right');
          player.play(player.controller.currentPosition + 1);
        }
        else if (dx > movethresh && dirx) {
          console.log('left');
          player.play(player.controller.currentPosition - 1);
        }
        if (dy > movethresh && !dirx) {
          if (davg > overthresh) {
            console.log('over up');
          }
          else {
            console.log('up');
          }
        }
        else if (dy < -movethresh && !dirx) {
          if (davg > overthresh) {
            console.log('over down');
          }
          else {
            console.log('down');
          }
        }
        state = 2;
        break;
    }
  }

  function test() {
    delt = _.createImageData(width, height);
    var totalx = 0, totaly = 0, totald = 0;
    var totaln = delt.width * delt.height, dscl = 0, pix = totaln * 4;

    if (last !== false) {
      while (pix) {
        var d = Math.abs(draw.data[pix] - last.data[pix]) +
                Math.abs(draw.data[pix + 1] - last.data[pix + 1]) +
                Math.abs(draw.data[pix + 2] - last.data[pix + 2]);
        if (d > thresh) {
          delt.data[pix] = 170;
          delt.data[pix + 1] = 255;
          delt.data[pix + 2] = delt.data[pix + 3] = 255;
          totald += 1;
          totalx += ((pix / 4) % width);
          totaly += (Math.floor((pix / 4) / delt.height));
        }
        else {
          delt.data[pix] = delt.data[pix + 1] = delt.data[pix + 2] = 0;
          delt.data[pix + 3] = 0;
        }
        pix = pix - 4;
      }
    }
    if (totald) {
      down = {
        x: totalx / totald,
        y: totaly / totald,
        d: totald
      };
      handledown();
    }
    //console.log(totald)
    last = draw;
    c_.putImageData(delt, 0, 0);
  }


  function dump() {
    if (canvas.width != video.videoWidth) {
      width = Math.floor(video.videoWidth / compression);
      height = Math.floor(video.videoHeight / compression);
      canvas.width = ccanvas.width = width;
      canvas.height = ccanvas.height = height;
    }
    _.drawImage(video, width, 0, -width, height);
    draw = _.getImageData(0, 0, width, height);
    //c_.putImageData(draw,0,0)
    test();
  }

  var compElement = document.createElement('canvas');
  compElement.setAttribute('id', 'comp');
  compElement.style.position = 'Fixed';
  compElement.style.left = 0;
  compElement.style.top = 0;
  compElement.style.width = '100%';
  compElement.style.height = '100%';
  compElement.style.zIndex = 1000;
  compElement.style.display = 'none';
  document.body.appendChild(compElement);
  var videoElement = document.createElement('video');
  videoElement.setAttribute('id', 'video');
  videoElement.setAttribute('autoplay', true);
  videoElement.style.width = '300px';
  videoElement.style.display = 'none';
  document.body.appendChild(videoElement);
  var canvasElement = document.createElement('canvas');
  canvasElement.setAttribute('id', 'canvas');
  canvasElement.style.width = '300px';
  canvasElement.style.display = 'none';
  document.body.appendChild(canvasElement);

  window.video = document.getElementById('video');
  window.canvas = document.getElementById('canvas');
  window._ = canvas.getContext('2d');
  window.ccanvas = document.getElementById('comp');
  window.c_ = ccanvas.getContext('2d');
  window.compression = 5;
  window.width = height = 0;
  window.last = false;
  window.thresh = 150;
  window.down = false;
  window.wasdown = false;
  window.movethresh = 2;
  window.brightthresh = 300;
  window.overthresh = 1000;
  window.avg = 0;
  window.state = 0; //States: 0 waiting, 1 waiting for next move, 2 waiting for end
  navigator.webkitGetUserMedia({audio: true, video: true},function(stream) {
    s = stream;
    video.src = window.webkitURL.createObjectURL(stream);
    video.addEventListener('play', function() {
      setInterval(dump, 1000 / 25);
    });
  }, function() {
    console.log('Breaking Bad!!!');
  });
})();

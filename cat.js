function init() {

    var originalImgCanvas = document.getElementById("originalImgCanvas");
    var elemLeft = originalImgCanvas.offsetLeft;
    var elemTop = originalImgCanvas.offsetTop;
    var ctx = originalImgCanvas.getContext("2d");
    var width = originalImgCanvas.width;
    var height = originalImgCanvas.height;

    var dx = width / 2;
    var dy = height / 2;
    var r = 70;

    var projectionLength = r * 2;
    var raysCnt = 70;
    var angleStep = 10;

    var projectionCanvasHeight = projectionLength;

    displayDefaultImage();

    originalImgCanvas.addEventListener('click', function(event) { 
            var x = event.pageX - elemLeft;
        var y = event.pageY - elemTop;
        var radius = 5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'black';
        ctx.fill();
    }, false);

    var simulateBtn = document.getElementById("simulateBtn");
    simulateBtn.addEventListener('click', function(event) { 

        var projectionImages = document.getElementById("projectionImages");
      while (projectionImages.firstChild) {
          projectionImages.removeChild(projectionImages.firstChild);
      }

      for(var i = 0; i <= 360; i+=angleStep) {
          var al = i * Math.PI / 180;
          var circleX = dx + r * Math.cos(al);
          var circleY = dy + r * Math.sin(al);

          /*
          // Radius vectors and tangent lines
          line(dx, dy, circleX, circleY);
          line(circleX - r * Math.sin(al), circleY + r * Math.cos(al), circleX + r * Math.sin(al), circleY - r * Math.cos(al));
          */

          var projection = traceXRays(al, r, dx, dy, raysCnt, projectionLength);

          var mycanvas = document.createElement("canvas");
          mycanvas.id = "generated_" + i;
          mycanvas.width = projectionLength;
          mycanvas.height = projectionCanvasHeight;
          mycanvas.style.border   = "1px solid";
          var mycanvasCtx = mycanvas.getContext("2d");

          projectionImages.appendChild(document.createElement("br"))
          projectionImages.appendChild(mycanvas);

          var step = projectionLength * 1.0 / raysCnt;

          /*
          mycanvasCtx.beginPath();
          mycanvasCtx.moveTo(0, projection[0] * (projectionCanvasHeight - 10));

          for(var j = 1; j < raysCnt; j++) {
              mycanvasCtx.lineTo(j * step, projection[j] * (projectionCanvasHeight - 10));
          }

          mycanvasCtx.stroke();
          */

          for(var j = 0; j < raysCnt; j++) {
              var intensity = Math.round(projection[j] * projection[j] * projection[j] * 256);
              mycanvasCtx.fillStyle = "rgb(" + [intensity,intensity,intensity].join(',') + ")";
              mycanvasCtx.fillRect(j * step, 0, Math.round(step) + 1, projectionCanvasHeight);
          }
      }

      //traceXRays(45 * 3.14 / 180, r, dx, dy, 20, r * 2);      

      backprojectionGathering();
      
    });
    
    function traceXRays(angle, radius, dx, dy, raysCnt, projectionLength) {

      var circleX = dx + radius * Math.cos(angle);
      var circleY = dy + radius * Math.sin(angle);

      var leftX = circleX - (projectionLength / 2) * Math.sin(angle);
      var leftY = circleY + (projectionLength / 2) * Math.cos(angle);

      var step = projectionLength * 1.0 / raysCnt;

      var projection = [];

      for(var i = 0; i < raysCnt; i++) {
          var fromX = leftX + step * i * Math.sin(angle);
          var fromY = leftY - step * i * Math.cos(angle);

          var toX = fromX - 2 * radius * Math.cos(angle);
          var toY = fromY - 2 * radius * Math.sin(angle);

          // used for visualization of the rays
          //line(fromX, fromY, toX, toY);

          var intensity = xray(fromX, fromY, toX, toY);
          projection.push(intensity);
      }

      return projection;
    }
    
    function backprojectionGathering() {
    
      var mycanvas = document.getElementById("tomographyCanvas");
      var mycanvasCtx = mycanvas.getContext("2d");
      
      mycanvasCtx.globalAlpha = 1;
      mycanvasCtx.fillStyle = 'white';
        mycanvasCtx.fillRect(0, 0, width, height);
      // http://stackoverflow.com/questions/2359537/how-to-change-the-opacity-alpha-transparency-of-an-element-in-a-canvas-elemen
      mycanvasCtx.globalAlpha = 0.05;
      for(var i = 0; i <= 360; i+=angleStep) {
          var c = document.getElementById("generated_" + i);
          // http://creativejs.com/2012/01/day-10-drawing-rotated-images-into-canvas/
          mycanvasCtx.save(); 
          mycanvasCtx.translate((width - c.width) / 2, (height - c.height) / 2);
          mycanvasCtx.translate(c.width / 2, c.height / 2)
          mycanvasCtx.rotate((i + 270) * Math.PI / 180);
          mycanvasCtx.drawImage(c,-c.width / 2, -c.height / 2);
          mycanvasCtx.restore();
      }
    }

    function displayDefaultImage(canvas) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'black';
      ctx.fillRect(60, 60, 80, 80);

      ctx.fillStyle = 'white';
      ctx.fillRect(65, 65, 70, 70);

      ctx.fillStyle = 'black';
      ctx.fillRect(120, 70, 5, 30);

      ctx.fillStyle = 'black';
      ctx.fillRect(80, 80, 20, 20);

      ctx.beginPath();
      ctx.arc(120,115,10,0,2*Math.PI);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(80,120,5,0,2*Math.PI);
      ctx.fill();
    }

    // http://stackoverflow.com/questions/4672279/bresenham-algorithm-in-javascript
    function line(x0, y0, x1, y1){
      var dx = Math.abs(x1-x0);
      var dy = Math.abs(y1-y0);
      var sx = (x0 < x1) ? 1 : -1;
      var sy = (y0 < y1) ? 1 : -1;
      var err = dx-dy;
      var terminationConst = 1.1;

      while(true){
        // putPixel
        ctx.fillStyle = 'black';
        ctx.fillRect(x0, y0, 1, 1);

        if ((Math.abs(x0-x1) < terminationConst) && (Math.abs(y0-y1) < terminationConst)) break;
        var e2 = 2*err;
        if (e2 >-dy){ err -= dy; x0  += sx; }
        if (e2 < dx){ err += dx; y0  += sy; }
      }
    }

    // http://stackoverflow.com/questions/4672279/bresenham-algorithm-in-javascript
    function xray(x0, y0, x1, y1){
      var dx = Math.abs(x1-x0);
      var dy = Math.abs(y1-y0);
      var sx = (x0 < x1) ? 1 : -1;
      var sy = (y0 < y1) ? 1 : -1;
      var err = dx-dy;

      var blackPixelsCnt = 0;
      var allPixelsCnt = 0;
      var terminationConst = 1.1;

      while(true){
        // getPixel
        var pixel = ctx.getImageData(Math.round(x0), Math.round(y0), 1, 1);
        var data = pixel.data;
        if(data[0] == 0) {
          blackPixelsCnt++;
        }
        allPixelsCnt++;

        if ((Math.abs(x0-x1) < terminationConst) && (Math.abs(y0-y1) < terminationConst)) break;
        var e2 = 2*err;
        if (e2 >-dy){ err -= dy; x0  += sx; }
        if (e2 < dx){ err += dx; y0  += sy; }
      }

      return 1.0 - blackPixelsCnt * 1.0 / allPixelsCnt;
    }
}
function init() {

    var originalImgCanvas = document.getElementById("originalImgCanvas");
    var elemLeft = originalImgCanvas.offsetLeft;
    var elemTop = originalImgCanvas.offsetTop;
    var ctx = originalImgCanvas.getContext("2d");
    var width = originalImgCanvas.width;
    var height = originalImgCanvas.height;

    var dx = width / 2;
    var dy = height / 2;
    var tomographRadius = 80;

    var projectionLength = tomographRadius * 2;
    var raysCnt = projectionLength;
    var fromAngle = 0;
    var toAngle = 360;
    var angleStep = 4;
    
    var animationDelay = 50;

    var projectionCanvasHeight = projectionLength;
    var projectionHatchingName = "generated_";
    var projectionIntensityName = "intensity_";

    var dynamicVisualization = true;

    displayDefaultImage();

    // Paint on originalImgCanvas
    // TODO: implement a proper way of painiting
    originalImgCanvas.addEventListener('click', function(event) { 
        var x = event.pageX - elemLeft;
        var y = event.pageY - elemTop;
        var radius = 5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'black';
        ctx.fill();
    }, false);
    
    var i;
    function loopIter() {
          var projectionImages = document.getElementById("projectionImages");
      
          var radonTransformCanvas = document.getElementById("radonTransformCanvas");
          var radonTransformCanvasCtx = radonTransformCanvas.getContext("2d");
    
          var al = i * Math.PI / 180;
          var projection = traceXRays(al, tomographRadius, dx, dy, raysCnt, projectionLength);

          projectionImages.appendChild(document.createElement("br")); 
          projectionImages.appendChild(document.createTextNode("angle of projection: " + i + String.fromCharCode(176)));
          projectionImages.appendChild(document.createElement("br"));

          var step = projectionLength * 1.0 / raysCnt;

          // Display intensity image
          var intensityCanvas = createCanvasElement(projectionIntensityName + i);
          var intensityCanvasCtx = intensityCanvas.getContext("2d");
          projectionImages.appendChild(intensityCanvas);
          intensityCanvasCtx.beginPath();
          intensityCanvasCtx.moveTo(0, projectionCanvasHeight * (1 - projection[0]));
          for(var j = 1; j < raysCnt; j++) {
              intensityCanvasCtx.lineTo(j * step, projectionCanvasHeight * (1 - projection[j]));
          }
          intensityCanvasCtx.stroke();
          
          // Insert gap into generated HTML
          projectionImages.appendChild(document.createTextNode(" "));

          // Display hatching image
          var hatchingCanvas = createCanvasElement(projectionHatchingName + i);
          var hatchingCanvasCtx = hatchingCanvas.getContext("2d");
          projectionImages.appendChild(hatchingCanvas);
          for(var j = 0; j < raysCnt; j++) {
              var intensity = Math.round(projection[j] * projection[j] * projection[j] * 256);
              hatchingCanvasCtx.fillStyle = "rgb(" + [intensity,intensity,intensity].join(',') + ")";
              hatchingCanvasCtx.fillRect(j * step, 0, Math.round(step) + 1, projectionCanvasHeight);
          }
          
          // Display Radon Transform
          for(var j = 0; j < raysCnt; j++) {
              var intensity = Math.round(projection[j] * projection[j] * projection[j] * 256);
              radonTransformCanvasCtx.fillStyle = "rgb(" + [intensity,intensity,intensity].join(',') + ")";
              radonTransformCanvasCtx.fillRect(i / 2 + 5, j, angleStep, 1);
          }
          
          i += angleStep;
          if(i <= toAngle) {
              setTimeout(loopIter, 0);
          } else {
              if(dynamicVisualization) {
              // Visualization with animation
              animationAngle = fromAngle;
              if(!animationIsScheduled) {
                  animationIsScheduled = true;
                  setTimeout(animationBackprojectionGathering, 0);
              }
              } else {
                  // Static visualization
                  backprojectionGathering();
              }
          }
    }

    var simulateBtn = document.getElementById("simulateBtn");
    simulateBtn.addEventListener('click', function(event) { 
      animationIsScheduled = false;
      cleanUpPreviousResults();
      i = fromAngle;
      loopIter();
    });
    
    function createCanvasElement(name) {
    
      var mycanvas = document.createElement("canvas");
      mycanvas.id = name;
      mycanvas.width = projectionLength;
      mycanvas.height = projectionCanvasHeight;
      mycanvas.style.border   = "1px solid";
      
      return mycanvas;
    }
    
    function cleanUpPreviousResults() {
    
      var projectionImages = document.getElementById("projectionImages");
      while (projectionImages.firstChild) {
          projectionImages.removeChild(projectionImages.firstChild);
      }
      
      // Fill tomography canvas with white color
      var mycanvas = document.getElementById("tomographyCanvas");
      var mycanvasCtx = mycanvas.getContext("2d");      
      mycanvasCtx.globalAlpha = 1;
      mycanvasCtx.fillStyle = 'white';
      mycanvasCtx.fillRect(0, 0, width, height);
      
      var radonTransformCanvas = document.getElementById("radonTransformCanvas");
      var radonTransformCanvasCtx = radonTransformCanvas.getContext("2d");
      radonTransformCanvasCtx.globalAlpha = 1;
      radonTransformCanvasCtx.fillStyle = 'white';
      radonTransformCanvasCtx.fillRect(0, 0, width, height);
    }
    
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
      var width = mycanvas.width;
      var height = mycanvas.height;
      
      // http://stackoverflow.com/questions/2359537/how-to-change-the-opacity-alpha-transparency-of-an-element-in-a-canvas-elemen
      mycanvasCtx.globalAlpha = angleStep * 2.0 / (toAngle - fromAngle + 1);
      for(var i = fromAngle; i <= toAngle; i+=angleStep) {
          var c = document.getElementById(projectionHatchingName + i);
          // http://creativejs.com/2012/01/day-10-drawing-rotated-images-into-canvas/
          mycanvasCtx.save(); 
          mycanvasCtx.translate(width / 2, height / 2);
          mycanvasCtx.rotate((i + 270) * Math.PI / 180);
          mycanvasCtx.drawImage(c,-c.width / 2, -c.height / 2);
          mycanvasCtx.restore();
      }
    }
    
    var animationAngle = fromAngle;
    var animationIsScheduled = false;
    function animationBackprojectionGathering() {
      if(!animationIsScheduled) {
        return;
      }
    
      var mycanvas = document.getElementById("tomographyCanvas");
      var mycanvasCtx = mycanvas.getContext("2d");
      var width = mycanvas.width;
      var height = mycanvas.height;
      
      if(animationAngle == fromAngle) {
          // Fill canvas with white color
          mycanvasCtx.globalAlpha = 1;
          mycanvasCtx.fillStyle = 'white';
          mycanvasCtx.fillRect(0, 0, width, height);
      }
      
      // http://stackoverflow.com/questions/2359537/how-to-change-the-opacity-alpha-transparency-of-an-element-in-a-canvas-elemen
      mycanvasCtx.globalAlpha = angleStep * 2.0 / (toAngle - fromAngle + 1);
      var c = document.getElementById(projectionHatchingName + animationAngle);
      if(c) {
          // http://creativejs.com/2012/01/day-10-drawing-rotated-images-into-canvas/
          mycanvasCtx.save(); 
          mycanvasCtx.translate(width / 2, height / 2);
          mycanvasCtx.rotate((animationAngle + 270) * Math.PI / 180);
          mycanvasCtx.drawImage(c, -c.width / 2, -c.height / 2, c.width, c.height);      
          mycanvasCtx.restore();
      }
      
      if(animationAngle != toAngle) {
          animationAngle += angleStep;
          setTimeout(animationBackprojectionGathering, animationDelay);
      } else {
          animationAngle = fromAngle;
          animationIsScheduled = false;
          //setTimeout(animationBackprojectionGathering, animationDelay * 5);
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

    // Trace the ray and calculate its intencity
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
        if(x0 >= 0 && x0 < width && y0 >= 0 && y0 < height) {
            var pixel = ctx.getImageData(x0, y0, 1, 1);
            var data = pixel.data;
            if(data[0] == 0) {
              blackPixelsCnt++;
            }
        }
        allPixelsCnt++;

        if ((Math.abs(x0-x1) < terminationConst) && (Math.abs(y0-y1) < terminationConst)) break;
        var e2 = 2*err;
        if (e2 >-dy){ err -= dy; x0  += sx; }
        if (e2 < dx){ err += dx; y0  += sy; }
      }

      return 1.0 - blackPixelsCnt * 1.0 / allPixelsCnt;
    }
    
    // Just used for debugging
    // TODO: remove
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
}
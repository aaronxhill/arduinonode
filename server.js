// SERVER

var http  = require('http')
  , fs    = require('fs')
  , path  = require('path')
  , mime  = require('mime')
  , cache = {};

function send404(response) {
  response.writeHead(404, {'Content-Type': 'text/plain'});
  response.write('Error 404: resource not found.');
  response.end();
}

function sendFile(response, filePath, fileContents) {
  response.writeHead(
    200,
    {"content-type": mime.lookup(path.basename(filePath))}
  );
  response.end(fileContents);
}

function serveStatic(response, cache, absPath) {
  if (cache[absPath]) {
    sendFile(response, absPath, cache[absPath]);
  } else {
    fs.exists(absPath, function(exists) {
      if (exists) {
        fs.readFile(absPath, function(err, data) {
          if (err) {
            send404(response);
          } else {
            cache[absPath] = data;
            sendFile(response, absPath, data);
          }
        });
      } else {
        send404(response);
      }
    });
  }
}

var server = http.createServer(function(request, response) {
  var filePath = false;
  if (request.url == '/') {
    filePath = 'index.html';
  } else {
    filePath = request.url;
  }
  var absPath = './' + filePath;
  serveStatic(response, cache, absPath);
});

server.listen(8080, function() {
  console.log("Server listening on port 8080.");
});

// track votes
var votes = 1; 

// use socket.io
var io = require('socket.io').listen(server);

// arduino vars
var five = require("johnny-five"),
    bumper, led,
    board = new five.Board();

//turn off debug
io.set('log level', 1);

// define interactions with client
io.sockets.on('connection', function(socket){

    //send data to client    
    board.on('on', function(){
        votes = votes + 1; 
        socket.emit('on', votes);
    });
    
});

board.on("ready", function() {
  bumper = new five.Button(2);
  led = new five.Led(13);
 
  bumper.on("down", function() {
    board.emit('on');
    if (votes % 2 === 0)
    {led.on();}
    else {led.off();}
    console.log('button down'); 
    console.log(votes); 
  }); 
  });
// });
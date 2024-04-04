const express = require('express');
const app = express();
const path = require('path');
const http = require('http')
const port = 3000;
// the socket.io stuff
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server);

const rooms = {}; // these are the rooms that currently have games open

// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, 'client')));

// Serve static files from the 'node_modules' directory
app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io/client-dist'));

// Default route 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Route with a gameId parameter
app.get('/game/:gameId', (req, res) => {
    console.log("routing to game with an id");
    const gameId = req.params.gameId;
    console.log("the id is: " + gameId);
    // Here you can handle different logic based on the roomId
    res.sendFile(path.join(__dirname, 'client', 'in-game.html'));
});

io.on('connection', (socket) => {
    console.log('a user has connected');
    socket.on('disconnect', () => {
      console.log('user disconnected');
    })

    socket.on('createGame', () => {
      const roomUniqueId = makeid(10);
      rooms[roomUniqueId] = {};
      console.log("room id created: " + roomUniqueId)
      socket.join(roomUniqueId); // connect incoming client (socket) to this room (by roomUniqueId)
      socket.emit("newGame", {roomUniqueId: roomUniqueId}); // server returning newGame with data
    })

    socket.on('joinGame', (data) => {
      if (rooms[data.roomUniqueId] != null) {
        console.log('server received joinGame from console! ' + data.roomUniqueId)
        socket.join(data.roomUniqueId); // joining incoming request to the same room (roomUniqueId should already exist)
        socket.to(data.roomUniqueId).emit('playersConnected', {}); // when t he two players join we can say they are connected
        socket.emit("playersConnected");
      }
    })

    socket.on('p1Choice', (data) => { // TODO - verify user is indeed p1 and not someone sending that socket value
        let typeChosen = data.typeChosen;
        rooms[data.roomUniqueId].p1Choice = typeChosen;

        socket.to(data.roomUniqueId).emit('p1Choice', {typeChosen : typeChosen});

        if(rooms[data.roomUniqueId].p2Choice != null) {
          declareWinner(data.roomUniqueId);
      }
    });

    socket.on('p2Choice', (data) => { // TODO - verify user is indeed p1 and not someone sending that socket value
      let typeChosen = data.typeChosen;
      rooms[data.roomUniqueId].p2Choice = typeChosen;

      socket.to(data.roomUniqueId).emit('p2Choice', {typeChosen : typeChosen});

      if(rooms[data.roomUniqueId].p1Choice != null) {
        declareWinner(data.roomUniqueId);
    }
  });

})

function declareWinner(roomUniqueId) {
  let p1Choice = rooms[roomUniqueId].p1Choice;
  let p2Choice = rooms[roomUniqueId].p2Choice;
  let winner = null;

  // This is what does the type chart!!!
  console.log("p1 chose: " + p1Choice + " and p2 chose: " + p2Choice);

}

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// helper function to make a room id
function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
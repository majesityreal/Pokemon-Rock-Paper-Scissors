const express = require('express');
const app = express();
const path = require('path');
const http = require('http')
const port = 3000;
// the socket.io stuff
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server);
const pokeTypes = require('dismondb'); // pokemon type chart calc library

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
  let netScore = 0; // if positive p1 wins, if negative p2 wins

  // This is what does the type chart calculations!!!
  console.log("p1 chose: " + p1Choice + " and p2 chose: " + p2Choice);
  // TODO - if "None", then pick a random available type!!!!!!!

  const p1Type = pokeTypes.typedex(p1Choice, 4); // 4 is the typeDex API version.
  const p2Type = pokeTypes.typedex(p2Choice, 4); // 4 is the typeDex API version.

  // check p1 attacking onto p2 defending
  console.log(p1Type.typemaps.gen6.attack);
  console.log(p2Type.typemaps.gen6.attack);
  if (p1Type.typemaps.gen6.attack.noEffect.includes(p2Choice)) { // p1 no effect on p2
    netScore -= 2;
  }
  if (p1Type.typemaps.gen6.attack.notVeryEffective.includes(p2Choice)) { // p1 not very effective on p2
    netScore -= 1;
  }
  if (p1Type.typemaps.gen6.attack.superEffective.includes(p2Choice)) { // p1 super effective on p2
    netScore += 1;
  }
  // p2 attacking p1 defending
  if (p2Type.typemaps.gen6.attack.noEffect.includes(p1Choice)) { // p2 no effect on p1
    netScore += 2;
  }
  if (p2Type.typemaps.gen6.attack.notVeryEffective.includes(p1Choice)) { // p2 not very effective on p1
    netScore += 1;
  }
  if (p2Type.typemaps.gen6.attack.superEffective.includes(p1Choice)) { // p2 super effective on p1
    netScore -= 1;
  }

  console.log("net score: " + netScore); // TODO - tiebreaker could be by how badly you were beaten (i.e. if you attack with fighting against ghost, you lose by 2 rather than by 1)
  if (netScore > 0) {
      console.log("player 1 wins!")
  }
  else if (netScore < 0) {
      console.log("player 2 wins!")
  }
  else {
      console.log("It is a tie!")
  }

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
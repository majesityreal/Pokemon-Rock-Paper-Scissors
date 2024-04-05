/*
npx tailwindcss -i ./client/style.css -o ./client/stylePlusTailwind.css --watch

TODO on flight! (Since no wifi)

Make multiple rounds. Store previous type choices in array and prevent them again
Keep track of who won

Timer? How to do synrconous stuff
// runs after 2 seconds
setTimeout(myFunction, 2000, firstParam, secondParam);

Stylizing stuff

*/

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
const { randomInt } = require('crypto');

// rooms which contain each active game
// each room object has attributes: (str)p1Choice, (str)p2Choice, (str[])typesRemaining, (int)p1Wins, (int)p2Wins
const rooms = {};
const pokemonTypes = [
  'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
]; // constant used to start the rooms

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
      rooms[roomUniqueId].typesRemaining = pokemonTypes // instantiating room vars here
      rooms[roomUniqueId].p1Wins = 0
      rooms[roomUniqueId].p2Wins = 0
      console.log("room id created: " + roomUniqueId)
      socket.join(roomUniqueId); // connect incoming client (socket) to this room (by roomUniqueId)
      socket.emit("newGame", {roomUniqueId: roomUniqueId, typesRemaining: pokemonTypes}); // server returning newGame with data
      console.log("room types: " + rooms[roomUniqueId].typesRemaining);
    })

    socket.on('joinGame', (data) => {
      if (rooms[data.roomUniqueId] != null) {
        console.log('server received joinGame from console! ' + data.roomUniqueId)
        socket.join(data.roomUniqueId); // joining incoming request to the same room (roomUniqueId should already exist)
        socket.to(data.roomUniqueId).emit('playersConnected', {}); // when t he two players join we can say they are connected
        socket.emit("playersConnected"); // this one is to send same transmission to the client that sent the 'joinGame' socket
      }
      else {
        // TODO - log to client trying to join, room does not exist yet
      }
    })

    socket.on('p1Choice', (data) => { // TODO - verify user is indeed p1 and not someone sending that socket value
        let typeChosen = data.typeChosen;
        rooms[data.roomUniqueId].p1Choice = typeChosen;

        socket.to(data.roomUniqueId).emit('p1Choice'); // we only want to tell them that p1 made a choice, not the contents of the choice for security.
        // (if sent to client side, intelligent person could view results before sending their choice)

        if(rooms[data.roomUniqueId].p2Choice != null) {
          declareRoundWinner(data.roomUniqueId, socket);
      }
    });

    socket.on('p2Choice', (data) => { // TODO - verify user is indeed p1 and not someone sending that socket value
      let typeChosen = data.typeChosen;
      rooms[data.roomUniqueId].p2Choice = typeChosen;

      socket.to(data.roomUniqueId).emit('p2Choice');
      if(rooms[data.roomUniqueId].p1Choice != null) {
        declareRoundWinner(data.roomUniqueId, socket);
    }
  });

})

function declareRoundWinner(roomUniqueId, socket) {
  let p1Choice = rooms[roomUniqueId].p1Choice;
  let p2Choice = rooms[roomUniqueId].p2Choice;
  let winner = null;
  // This is what does the type chart calculations!!!
  console.log("p1 chose: " + p1Choice + " and p2 chose: " + p2Choice);
  // TODO - if "None", then pick a random available type!!!!!!!
  console.log("random integer " + randomInt(rooms[roomUniqueId].typesRemaining.length));
  // if they do not choose a type, they get a random one
  if (p1Choice == "None" || p1Choice == null) {
    var typesRemaining = rooms[roomUniqueId].typesRemaining;
    var randI = randomInt(typesRemaining.length);
    p1Choice = typesRemaining[randI];
    rooms[roomUniqueId].p1Choice = p1Choice; // now we set the game p1Choice
  }
  if (p2Choice == "None" || p2Choice == null) {
    var typesRemaining = rooms[roomUniqueId].typesRemaining;
    var randI = randomInt(typesRemaining.length);
    p2Choice = typesRemaining[randI];
    rooms[roomUniqueId].p2Choice = p2Choice; // now we set the game p1Choice
    console.log("p2 didnt choose anything, their choice is now: " + p2Choice);
  }
  // run the types against each other to determine who wins
  let netScore = typeCalcs(p1Choice, p2Choice);
  console.log("net score: " + netScore); // TODO - tiebreaker could be by how badly you were beaten (i.e. if you attack with fighting against ghost, you lose by 2 rather than by 1)
  if (netScore > 0) {
      console.log("player 1 wins!");
      winner = "Player1";
  }
  else if (netScore < 0) {
      console.log("player 2 wins!");
      winner = "Player2";
  }
  else {
      console.log("It is a tie!");
      winner = "Tie";
  }

  // display to both clients the results!
  // we need both of these to send to both clients (.to() sends to other one, plain emit() sends to one we received from)
  socket.to(roomUniqueId).emit('matchResults', {winner: winner, p1Choice: rooms[roomUniqueId].p1Choice, p2Choice: rooms[roomUniqueId].p2Choice});
  socket.emit('matchResults', {winner: winner, p1Choice: rooms[roomUniqueId].p1Choice, p2Choice: rooms[roomUniqueId].p2Choice});
  
  // TODO Prep for next round or end the session
}

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

///////////////// HELPER FUNCTIONS HERE ///////////////////////////
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

// helper function to do type calcs
// returns (int)netScore. (-) means p2 won, (+) means p1 won
function typeCalcs(p1Choice, p2Choice) {
  let netScore = 0;
  const p1Type = pokeTypes.typedex(p1Choice, 4); // 4 is the typeDex API version.
  const p2Type = pokeTypes.typedex(p2Choice, 4); // 4 is the typeDex API version.

  // check p1 attacking onto p2 defending
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
  return netScore;
}
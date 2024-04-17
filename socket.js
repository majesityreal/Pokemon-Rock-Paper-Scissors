/*
npx tailwindcss -i ./client/style.css -o ./client/stylePlusTailwind.css --watch

OVERALL TODO
Stylizing stuff - make it look nicer
Declare a round winner after 3 (or X wins). If there is no winner after all the types have been chosen,
  tie it and do ELO based on tie

Accounts. People can create accounts, this is only for the ELO system.
ELO system.

// socket.io generates a socket.id every time it connects. so that is unique!
// give the client a new thing
Lobbies
  When creating lobbies, can make private or public. Private means only by direct code can you join
  Public you can be joined from quickmatch. Quickmatch pairs you up with an open lobby.

// KNOWN BUGS
// if you don't pick anything, it does not display the random pick on your client end (opponent works)
// random function grabs any type, NEEDS TO BE FROM types remaining

*/
// main node.js server functionalitys
console.log("SERFVER.JS IS BEING CALLED!!!!!");
// the socket.io stuff
const dataFromMainJS = require('./main'); // grabbing the httpServer created in main.js in order to create our socket var io
const io = dataFromMainJS.io;

const pokeTypes = require('dismondb'); // pokemon type chart calc library
const { randomInt } = require('crypto');
const jwt = require('jsonwebtoken');
const { getInfoFromJwt } = require('./routes/auth');
const Player = require('./routes/game').Player;
const { User, getElo, updateElo, getUserByUsername } = require('./models/User');
const elo = require('./helpers/elo');

// rooms which contain each active game
// each room object has attributes: 
// (str)p1Choice, (str)p2Choice, (str[])typesRemaining, (int)p1Wins, (int)p2Wins
const rooms = {};
// (Player[])players, (str[])typesRemaining
// TODO - make a Player object which stores choice, wins, IP/data, etc
const pokemonTypes = [
  'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
]; // constant used between rounds timer
const timeBetweenRounds = 3;
const numRoundWinsToWin = 1;

// ADDME - not implemented yet, just here to show the :gameId operator, having variables in the URL
// Route with a gameId parameter
// app.get('/game/:gameId', (req, res) => {
//     console.log("routing to game with an id");
//     const gameId = req.params.gameId;
//     console.log("the id is: " + gameId);
//     // Here you can handle different logic based on the roomId
//     res.render('in-game');
// });

io.on('connection', (socket) => {
    console.log('=-= =-= =-=');
    console.log('a user has connected');
    socket.on('disconnect', (reason) => { // TODO - work on disconnect features
      console.log(`socket ${socket.id} disconnected due to ${reason}`);
      // Iterate through rooms the player was in and call 'leaveRoom' logic

      // Find the room the player was in
      const roomId = Object.keys(socket.rooms).find(roomId => roomId == socket.id);
      console.log("room is " + roomId);
      if (roomId && rooms[roomId]) {
        // Remove the player from the room
        rooms[roomId] = rooms[roomId].filter(playerId => playerId !== socket.id);
        // Check if the room is empty
        if (rooms[roomId].length === 0) {
          // Delete the room
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted because it became empty.`);
        }
    }
    })

    socket.on('createGame', () => {
      const roomUniqueId = makeid(10);
      rooms[roomUniqueId] = {};
      rooms[roomUniqueId].typesRemaining = [...pokemonTypes]; // have to create a shallow copy of the array, arrays in JS are pass by reference
      // check the jwt if user is logged in, and then add cookie for session
        // Access cookies from the handshake object
        const cookies = socket.handshake.headers.cookie;
        const parsedCookies = parseCookies(cookies);
        const jwtToken = parsedCookies.jwt;
        const jwtInfo = getInfoFromJwt(jwtToken);
        var p1;
        if (jwtInfo) {
          getElo(jwtInfo.id).then((eloVal) => {
            console.log("elo value: " + eloVal);
            p1 = new Player(jwtInfo.username, eloVal);
            rooms[roomUniqueId].p1 = p1;
            console.log("room id created: " + roomUniqueId)
            socket.join(roomUniqueId); // connect incoming client (socket) to this room (by roomUniqueId)
            socket.emit("newGame", {roomUniqueId: roomUniqueId, typesRemaining: pokemonTypes}); // server returning newGame with data
          });
          // p1 = new Player(username, 1000);
        }
        else { // default, no connection to DB
          p1 = new Player("default", 1000);
          rooms[roomUniqueId].p1 = p1;
          console.log("room id created: " + roomUniqueId)
          socket.join(roomUniqueId); // connect incoming client (socket) to this room (by roomUniqueId)
          socket.emit("newGame", {roomUniqueId: roomUniqueId, typesRemaining: pokemonTypes}); // server returning newGame with data
        }
    })

    socket.on('joinGame', (data) => {
      if (rooms[data.roomUniqueId] != null) {
        console.log('server received joinGame from console! ' + data.roomUniqueId)
        const cookies = socket.handshake.headers.cookie;
        const parsedCookies = parseCookies(cookies);
        const jwtToken = parsedCookies.jwt;
        const jwtInfo = getInfoFromJwt(jwtToken);
        var p2;
        if (jwtInfo) {
          getElo(jwtInfo.id).then((eloVal) => {
            console.log("elo value: " + eloVal);
            p2 = new Player(jwtInfo.username, eloVal);
            rooms[data.roomUniqueId].p2 = p2;
            console.log("room id created: " + data.roomUniqueId)
            socket.join(data.roomUniqueId); // joining incoming request to the same room (roomUniqueId should already exist)
            socket.to(data.roomUniqueId).emit('playersConnected'); // when t he two players join we can say they are connected
            socket.emit("playersConnected"); // this one is to send same transmission to the client that sent the 'joinGame' socket
          });
          // p1 = new Player(username, 1000);
        }
        else { // default, no connection to DB
          p2 = new Player("default", 1000);
          rooms[data.roomUniqueId].p2 = p2;
          console.log("room id created: " + data.roomUniqueId)
          socket.join(data.roomUniqueId); // joining incoming request to the same room (roomUniqueId should already exist)
          socket.to(data.roomUniqueId).emit('playersConnected'); // when t he two players join we can say they are connected
          socket.emit("playersConnected"); // this one is to send same transmission to the client that sent the 'joinGame' socket
        }
      }
      else {
        // TODO - log to client trying to join, room does not exist yet
      }
    })

    socket.on('p1Choice', (data) => { // TODO - verify user is indeed p1 and not someone sending that socket value
        let typeChosen = data.typeChosen;
        var typesRemaining = rooms[data.roomUniqueId].typesRemaining;
        // if they do not choose a type, they get a random one
        // last option: they sent a type that is not allowed, either a glitch or they cheated (modified client.js)
        if (typeChosen == "None" || typeChosen == null || !typesRemaining.includes(typeChosen)) { 
          var randI = randomInt(typesRemaining.length); // if typesRemaining.length == 0, welp... we're fucked. That is why we do not let it get to that point
          p1Choice = typesRemaining[randI];
          rooms[data.roomUniqueId].p1.typeChoice = p1Choice; // now we set the game p1Choice
        }
        rooms[data.roomUniqueId].p1.typeChoice = typeChosen;
        socket.to(data.roomUniqueId).emit('p1Choice'); // we only want to tell them that p1 made a choice, not the contents of the choice for security.
        // (if sent to client side, intelligent person could view results before sending their choice)

        if(rooms[data.roomUniqueId].p2.typeChoice != null) {
          declareRoundWinner(data.roomUniqueId, socket);
      }
    });

    socket.on('p2Choice', (data) => { // TODO - verify user is indeed p1 and not someone sending that socket value
      let typeChosen = data.typeChosen;
      console.log('type hconse: ' + typeChosen);
      var typesRemaining = rooms[data.roomUniqueId].typesRemaining;
      if (typeChosen == "None" || typeChosen == null || !typesRemaining.includes(typeChosen)) { 
        var randI = randomInt(typesRemaining.length);
        p2Choice = typesRemaining[randI];
        rooms[data.roomUniqueId].p2.typeChoice = p2Choice; // now we set the game p1Choice
      }
      rooms[data.roomUniqueId].p2.typeChoice = typeChosen;
      socket.to(data.roomUniqueId).emit('p2Choice');
      if(rooms[data.roomUniqueId].p1.typeChoice != null) {
        declareRoundWinner(data.roomUniqueId, socket);
    }
    });

    socket.on('printRoomsInfo', () => {
      printObjectProperties(rooms);
    });
})

///////////////// HELPER FUNCTIONS HERE ///////////////////////////
function declareRoundWinner(roomUniqueId, socket) {
  let p1Choice = rooms[roomUniqueId].p1.typeChoice;
  let p2Choice = rooms[roomUniqueId].p2.typeChoice;
  let winner = null;
  // This is what does the type chart calculations!!!
  console.log("p1 chose: " + p1Choice + " and p2 chose: " + p2Choice);
  // TODO - if "None", then pick a random available type!!!!!!!
  console.log("random integer " + randomInt(rooms[roomUniqueId].typesRemaining.length));
  // run the types against each other to determine who wins
  let typeCalcResults = typeCalcs(p1Choice, p2Choice);
  let netScore = typeCalcResults.score;
  let typeInteraction = typeCalcResults.typeInteraction;
  console.log("type interaction: " + typeInteraction)
  console.log("net score: " + netScore); // TODO - tiebreaker could be by how badly you were beaten (i.e. if you attack with fighting against ghost, you lose by 2 rather than by 1)
  if (netScore > 0) {
      rooms[roomUniqueId].p1.wins += 1;
      winner = "p1";
  }
  else if (netScore < 0) {
    rooms[roomUniqueId].p2.wins += 1;
    winner = "p2";
  }
  else {
      console.log("It is a tie!");
      winner = "tie";
  }
  console.log("winner: " + winner)
  // display to both clients the results!
  // we need both of these to send to both clients (.to() sends to other one, plain emit() sends to one we received from)
  socket.to(roomUniqueId).emit('matchResults', {winner: winner, typeInteraction: typeInteraction, p1Choice: rooms[roomUniqueId].p1.typeChoice, p2Choice: rooms[roomUniqueId].p2.typeChoice, p1Wins: rooms[roomUniqueId].p1.wins, p2Wins: rooms[roomUniqueId].p2.wins});
  socket.emit('matchResults', {winner: winner, typeInteraction: typeInteraction, p1Choice: rooms[roomUniqueId].p1.typeChoice, p2Choice: rooms[roomUniqueId].p2.typeChoice, p1Wins: rooms[roomUniqueId].p1.wins, p2Wins: rooms[roomUniqueId].p2.wins});
  // check for winner, otherwise restart the game
  if (rooms[roomUniqueId].p1.wins >= numRoundWinsToWin) {
    declareGameWinner(socket, roomUniqueId, rooms[roomUniqueId].p1, rooms[roomUniqueId].p2);
  }
  else if (rooms[roomUniqueId].p2.wins >= numRoundWinsToWin) {
    declareGameWinner(socket, roomUniqueId, rooms[roomUniqueId].p2, rooms[roomUniqueId].p1);
  }
  else {
    countdownAndRestartGame(timeBetweenRounds, socket, roomUniqueId);
  }

}

// winner + loser are Player objects
function declareGameWinner(socket, roomUniqueId, winner, loser) {

  // calculate ELO change
  let winnerELO = elo.getNewRating(winner.elo, loser.elo, 1); // gets winner ELO
  let loserELO = elo.getNewRating(loser.elo, winner.elo, 0); // gets loser ELO

  updateElo(winner.username, winnerELO);
  updateElo(loser.username, loserELO);

  console.log("winner ELO: " + winnerELO);
  console.log("loser ELO: " + loserELO);

  socket.to(roomUniqueId).emit('gameWon', {});
  socket.emit('gameWon', {});
}

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

// Function to display countdown timer
function countdownAndRestartGame(amountOfTime, socket, roomUniqueId) {
  let count = amountOfTime;
  const countdownInterval = setInterval(() => {
      // Send countdown to clients
      socket.to(roomUniqueId).emit('timer', {time: count});
      socket.emit('timer', {time: count});

      count--;
      if (count < 0) {
          clearInterval(countdownInterval);
          restartGame(socket, roomUniqueId);
      }
  }, 1000);
}

// helper function to do type calcs
// returns (int)netScore. (-) means p2 won, (+) means p1 won
// also returns typeInteraction string, first letter is p1 second is p2
// i.e. "0g" p1 no effect, p2 super effective
function typeCalcs(p1Choice, p2Choice) {
  let netScore = 0;
  let typeInteraction = ""; // codes: {0: no effect, b: not very effective, g: super effectie, n: neutral hit}
  const p1Type = pokeTypes.typedex(p1Choice, 4); // 4 is the typeDex API version.
  const p2Type = pokeTypes.typedex(p2Choice, 4); // 4 is the typeDex API version.

  // check p1 attacking onto p2 defending
  if (p1Type.typemaps.gen6.attack.noEffect.includes(p2Choice)) { // p1 no effect on p2
    netScore -= 2;
    typeInteraction += "0"
  }
  else if (p1Type.typemaps.gen6.attack.notVeryEffective.includes(p2Choice)) { // p1 not very effective on p2
    netScore -= 1;
    typeInteraction += "b"
  }
  else if (p1Type.typemaps.gen6.attack.superEffective.includes(p2Choice)) { // p1 super effective on p2
    netScore += 1;
    typeInteraction += "g"
  }
  else {
    typeInteraction += "n"
  }
  // p2 attacking p1 defending
  if (p2Type.typemaps.gen6.attack.noEffect.includes(p1Choice)) { // p2 no effect on p1
    netScore += 2;
    typeInteraction += "0"
  }
  else if (p2Type.typemaps.gen6.attack.notVeryEffective.includes(p1Choice)) { // p2 not very effective on p1
    netScore += 1;
    typeInteraction += "b"
  }
  else if (p2Type.typemaps.gen6.attack.superEffective.includes(p1Choice)) { // p2 super effective on p1
    netScore -= 1;
    typeInteraction += "g"
  }
  else {
    typeInteraction += "n"
  }
  return { score: netScore, typeInteraction: typeInteraction };
}

function restartGame(socket, roomUniqueId) {
  console.log("game restarted! room id: " + roomUniqueId);
  const currRoom = rooms[roomUniqueId];
  console.log("types remain: " + currRoom.typesRemaining);
  // increment who won?

  // remove player choices
  const p1Index = currRoom.typesRemaining.indexOf(currRoom.p1.typeChoice);
  if (p1Index !== -1) { currRoom.typesRemaining.splice(p1Index, 1); }
  const p2Index = currRoom.typesRemaining.indexOf(currRoom.p2.typeChoice);
  if (p2Index !== -1) { currRoom.typesRemaining.splice(p2Index, 1); }

  // clear p1 and p2 choices
  currRoom.p1.typeChoice = null;
  currRoom.p2.typeChoice = null;

  const dataToEmit = { typesRemaining: currRoom.typesRemaining, p1Wins: currRoom.p1.wins, p2Wins: currRoom.p2.wins }
  socket.to(roomUniqueId).emit('restartGame', dataToEmit); // TODO - put in some data here
  socket.emit('restartGame', dataToEmit);
}

function printObjectProperties(obj, indentation = '') {
  for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
          console.log(indentation + key + ": ");
          printObjectProperties(obj[key], indentation + '  ');
      } else {
          console.log(indentation + key + ": " + obj[key]);
      }
  }
}
// splits cookies into (key, value) pairs
function parseCookies(cookieString) {
  if (cookieString) {
    return cookieString.split(';').reduce((cookies, cookie) => {
      const [name, value] = cookie.trim().split('=');
      cookies[name] = value;
      return cookies;
    }, {});
  }
  else {
    return false;
  }
}

module.exports = { rooms: rooms };
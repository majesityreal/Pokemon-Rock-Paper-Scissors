/*
npx tailwindcss -i ./client/style.css -o ./client/stylePlusTailwind.css --watch

OVERALL TODO
- If there is no winner after all the types have been chosen,
  tie it and do ELO based on tie

- Caching database for leaderboard (display leaderboard, but cache it if top 100 user so do not need to read from it super often)

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
const matchmaking = require('./helpers/matchmaking');
const matchmakingSystem = new matchmaking.MatchmakingSystem();
// this makes it print out the matchmaking bins every second
// setInterval(() => {
//   matchmakingSystem.printAllBins();
// }, 1000);
var matchmakingIntervals = {}; // dictionary storing {player.socketId, intervalId} to handle matchmaking

// rooms which contain each active game
// each room object has attributes: 
// (Player)p1, (Player)p2, (str[])typesRemaining,
const rooms = {};
// (Player[])players, (str[])typesRemaining
const pokemonTypes = [
  'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
]; // constant used between rounds timer
const timeBetweenRounds = 3;
const numRoundWinsToWin = 1;
const timeBeforeCheckingNeighboringBins = 5000; // in ms
const timeBetweenCheckingMatchmaking = 1000; // in ms, checks queue every X for a potential match
const maxTimeToMatchmake = 20000; // should not matchmake more than 20 seconds!
const maxBinsToExtend = 4;

// ADDME - not implemented yet, just here to show the :gameId operator, having variables in the URL
// Route with a gameId parameter
// app.get('/game/:gameId', (req, res) => {
//     console.log("routing to game with an id");
//     const gameId = req.params.gameId;
//     console.log("the id is: " + gameId);
//     // Here you can handle different logic based on the roomId
//     res.render('in-game');
// });

// nsp = namespace, in my case it is "io.sockets" which makes it kinda ugly
// nsp.sockets.get(socketid).join(roomId)
// nsp.to(roomId).emit("message",{message : "something"})

io.on('connection', (socket) => {
    console.log('=-= =-= =-=');
    console.log('a user has connected');
    console.log("socket: " + io.sockets.sockets.get(socket.id).id);
    console.log('=-= =-= =-=');
    socket.on('disconnect', (reason) => { // TODO - work on disconnect features

      // TODO - disconnect from a room, send room message that player disconnected and has 1 minute to reconnect or something
          // Get the list of rooms the socket is currently joined to
          const roomsJoined = Object.keys(socket.rooms);
          console.log(' rooms joined: ' + JSON.stringify(roomsJoined));

          // Iterate over the rooms joined by the socket
          roomsJoined.forEach(roomId => {
              // Perform cleanup or update actions for each room
              // For example, you can delete the room from the rooms object
              delete rooms[roomId];
          });
      
      // FIXME VERY IMPORTANT: when a player disconnects, we need to clear the matchmakingIntervals dictionary. This uses socketId to store player matchmaking timer!

      let player = matchmakingSystem.players[socket.id];
      if (player) { // if player is matchmaking
        console.log(`player disconnected, removing ${JSON.stringify(player)} from matchmaking`);
        removeFromMatchmaking(player);
      }

      // do other stuff too

      console.log(`socket ${socket.id} disconnected due to ${reason}`);
      // Iterate through rooms the player was in and call 'leaveRoom' logic

    })

    socket.on('createGame', async () => {
      const roomUniqueId = makeid(10);
      rooms[roomUniqueId] = {};
      rooms[roomUniqueId].typesRemaining = [...pokemonTypes]; // have to create a shallow copy of the array, arrays in JS are pass by reference
      // check the jwt if user is logged in, and then add cookie for session
      // Access cookies from the handshake object
      const cookies = socket.handshake.headers.cookie;
      console.log("room id created: " + roomUniqueId)
      // create player object
      var p1 = await createPlayer(cookies, socket.id);
      rooms[roomUniqueId].p1 = p1;
      socket.join(roomUniqueId); // connect incoming client (socket) to this room (by roomUniqueId)
      socket.emit("newGame", {roomUniqueId: roomUniqueId, typesRemaining: pokemonTypes}); // server returning newGame with data
    })

    socket.on('joinGame', async (data) => {
      if (rooms[data.roomUniqueId] != null) {
        console.log('server received joinGame from console! ' + data.roomUniqueId)
        const cookies = socket.handshake.headers.cookie;
        var p2 = await createPlayer(cookies, socket.id);
        rooms[data.roomUniqueId].p2 = p2;
        socket.join(data.roomUniqueId);
        io.to(data.roomUniqueId).emit('playersConnected'); // this sends it to all other sockets in the room
      }
      else {
        // TODO - log to client trying to join, room does not exist yet
      }
    })

    socket.on('matchmake', async (data) => {
      // we want player username, and other stuff from data
      // use the MatchMaking class
      const cookies = socket.handshake.headers.cookie;
      // create player object
      var p1 = await createPlayer(cookies, socket.id);
      matchmake(p1);
    })

    socket.on('cancelMatchmake', (data) => {
      let player = matchmakingSystem.players[socket.id];
      if (player) { // if player is matchmaking
        console.log(`player canceled matchmaking, removing ${JSON.stringify(player)} from matchmaking`);
        removeFromMatchmaking(player);
      }
    })

    socket.on('p1Choice', (data) => { // TODO - verify user is indeed p1 and not someone sending that socket value
        let typeChosen = data.typeChosen;
        var typesRemaining = rooms[data.roomUniqueId].typesRemaining;
        console.log('room unique id: ' + data.roomUniqueId);
        console.log('Room info:  ' + JSON.stringify(rooms[data.roomUniqueId]));
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
      console.log('room unique id: ' + data.roomUniqueId);
      console.log('Room info:  ' + JSON.stringify(rooms[data.roomUniqueId]));
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
function matchmake(player) {
  // check if already matchmaking, if so do not allow
  if (matchmakingIntervals[player.socketId]) {
    // TODO - error message to user, already matchmaking!
    console.log("you are already in matchmaking!");
    return;
  }

  var opponent = matchmakingSystem.findMatchForPlayer(player, player.elo);
  if (opponent) { // if opponent, I am the one who found a match. I am the second, opponent joined queue first
    removeFromMatchmaking(opponent);
    removeFromMatchmaking(player);
    createMatch(opponent, player);
    return;
  }

  // if we get here, we did not find anybody in the bin so we matchmakeExtended bins
  // matchmakeExtended is a recursive function
  matchmakingIntervals[player.socketId] = setTimeout(() => {
    matchmakeExtended(player, 1);
  }, 5000);
  console.log("setting timeout with value: " + matchmakingIntervals[player.socketId]);
}

function removeFromMatchmaking(player) {
  // take player's socket out of the matchmaking dict. we do this first to minimize possible race conditions
  clearTimeout(matchmakingIntervals[player.socketId]);
  delete (matchmakingIntervals[player.socketId]); // lol i used to have this before clearTimeout... I wonder why THAT didn't work?????
  let retVal = matchmakingSystem.removePlayerFromMatchmaking(player);
  if (retVal == false) {
    console.error('couldnt remove player from matchmaking! something fishy here ' + JSON.stringify(player));
  }
  // take player out of player matchmaking dict
  delete matchmakingSystem.players[player.socketId] 
}

function disconnectedRemoveFromMatchmaking(socketId) {
  let idkTempPlayer = new Player("dummy", ELOVALUEIDKWHATITIS, socketId);
  let retVal = matchmakingSystem.removeDisconnectedPlayerFromMatchmaking(player);
  if (retVal == false) {
    console.error('couldnt remove player from matchmaking! something fishy here ' + JSON.stringify(socketId));
  }
  // take player out of the matchmaking dict
  delete (matchmakingIntervals[socketId]);
  clearTimeout(matchmakingIntervals[socketId]);
}

// RECURSIVE helper function for extending bins, keep extending until it finds somebody
function matchmakeExtended(player, intExtended) {
  if (intExtended > maxBinsToExtend) { // prevents 3000 ELO from playing 1000 elo lol, limits how far it can search
    return;
  }
  opponent = matchmakingSystem.findMatchExtendedBins(player, player.elo, intExtended); // extending bins by intExtended!
  console.log(`checking extending bins! opponent is ${opponent}`);
  if (opponent) {
    removeFromMatchmaking(opponent);
    removeFromMatchmaking(player);
    createMatch(opponent, player);
    return;
  }
  matchmakeExtended(player, intExtended + 1); // recursive call
}

function createMatch(p1, p2) {
  delete matchmakingSystem.players[p1.socketId]
  delete matchmakingSystem.players[p2.socketId]
  // create room!
  roomUniqueId = makeid(10);
  console.log("creating match after matchmake with id: " + roomUniqueId + " and player 1: " + JSON.stringify(p1) + " and p2: " + JSON.stringify(p2));
  rooms[roomUniqueId] = {};
  rooms[roomUniqueId].typesRemaining = [...pokemonTypes]; // have to create a shallow copy of the array, arrays in JS are pass by reference
  rooms[roomUniqueId].p1 = p1;
  rooms[roomUniqueId].p2 = p2;
  // both players join socket room
  io.sockets.sockets.get(p1.socketId).join(roomUniqueId);
  io.sockets.sockets.get(p2.socketId).join(roomUniqueId);
  // tell p1 to be p1 (all clients are by default p2 so we don't need to tell them)
  io.sockets.sockets.get(p1.socketId).emit('setP1');
  io.to(roomUniqueId).emit('playersConnected', { roomUniqueId: roomUniqueId }); // this sends it ALL sockets in the room

}

async function createPlayer(cookies, socketId) {
  const parsedCookies = parseCookies(cookies);
  const jwtToken = parsedCookies.jwt;
  const jwtInfo = getInfoFromJwt(jwtToken);
  var p1;
  // createPlayer
  if (jwtInfo) {
    const eloVal = await getElo(jwtInfo.id);
    console.log("createPlayer() elo value: " + eloVal);
    p1 = new Player(jwtInfo.username, eloVal, socketId);
    return p1;
  }
  else { // default, no connection to DB
    p1 = new Player("default", 1000, socketId);
    return p1;
  }
}

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
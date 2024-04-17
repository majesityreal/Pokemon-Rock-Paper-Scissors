// /*
// npx tailwindcss -i ./client/style.css -o ./client/stylePlusTailwind.css --watch

// OVERALL TODO
// Stylizing stuff - make it look nicer
// Declare a round winner after 3 (or X wins). If there is no winner after all the types have been chosen,
//   tie it and do ELO based on tie

// Accounts. People can create accounts, this is only for the ELO system.
// ELO system.

// // socket.io generates a socket.id every time it connects. so that is unique!
// // give the client a new thing
// Lobbies
//   When creating lobbies, can make private or public. Private means only by direct code can you join
//   Public you can be joined from quickmatch. Quickmatch pairs you up with an open lobby.

// // KNOWN BUGS
// // if you don't pick anything, it does not display the random pick on your client end (opponent works)
// // random function grabs any type, NEEDS TO BE FROM types remaining

// */
// // main node.js server functionalitys
// const http = require('http')
// console.log("SERFVER.JS copy IS BEING CALLED!!!!!");
// const express = require('express');
// const app = express();
// app.set('view engine', 'ejs'); // Set EJS as the view engine
// // the socket.io stuff
// const server = http.createServer(app);
// const {Server} = require('socket.io');
// const io = new Server(server);
// const path = require('path');
// // extra stuff added to
// const pokeTypes = require('dismondb'); // pokemon type chart calc library
// const { randomInt } = require('crypto');
// const port = 3000;
// // rooms which contain each active game
// // each room object has attributes: 
// // (str)p1Choice, (str)p2Choice, (str[])typesRemaining, (int)p1Wins, (int)p2Wins
// const rooms = {};
// const pokemonTypes = [
//   'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
//   'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
//   'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
// ]; // constant used to start the rooms

// // Serve static files from the 'client' directory
// app.use(express.static(path.join(__dirname, 'client')));

// // Serve static files from the 'node_modules' directory
// app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io/client-dist'));

// // Default route 
// app.get('/', (req, res) => {
//     res.render('index');
// });

// // ADDME - not implemented yet, just here to show the :gameId operator, having variables in the URL
// // Route with a gameId parameter
// app.get('/game/:gameId', (req, res) => {
//     console.log("routing to game with an id");
//     const gameId = req.params.gameId;
//     console.log("the id is: " + gameId);
//     // Here you can handle different logic based on the roomId
//     res.render('in-game');
// });

// io.on('connection', (socket) => {
//     console.log('a user has connected');
//     socket.on('disconnect', () => { // TODO - work on disconnect features
//       console.log('user disconnected');
//       // Iterate through rooms the player was in and call 'leaveRoom' logic
//       console.log(socket.id);
//       // Find the room the player was in
//       const roomId = Object.keys(socket.rooms).find(roomId => roomId == socket.id);
//       console.log("room is " + roomId);
//       if (roomId && rooms[roomId]) {
//         // Remove the player from the room
//         rooms[roomId] = rooms[roomId].filter(playerId => playerId !== socket.id);
//         // Check if the room is empty
//         if (rooms[roomId].length === 0) {
//           // Delete the room
//           delete rooms[roomId];
//           console.log(`Room ${roomId} deleted because it became empty.`);
//         }
//     }
//     })

//     socket.on('createGame', () => {
//       const roomUniqueId = makeid(10);
//       rooms[roomUniqueId] = {};
//       rooms[roomUniqueId].typesRemaining = [...pokemonTypes]; // have to create a shallow copy of the array, arrays in JS are pass by reference
//       rooms[roomUniqueId].p1Wins = 0
//       rooms[roomUniqueId].p2Wins = 0
//       console.log("room id created: " + roomUniqueId)
//       socket.join(roomUniqueId); // connect incoming client (socket) to this room (by roomUniqueId)
//       socket.emit("newGame", {roomUniqueId: roomUniqueId, typesRemaining: pokemonTypes}); // server returning newGame with data
//     })

//     socket.on('joinGame', (data) => {
//       if (rooms[data.roomUniqueId] != null) {
//         console.log('server received joinGame from console! ' + data.roomUniqueId)
//         socket.join(data.roomUniqueId); // joining incoming request to the same room (roomUniqueId should already exist)
//         socket.to(data.roomUniqueId).emit('playersConnected', {}); // when t he two players join we can say they are connected
//         socket.emit("playersConnected"); // this one is to send same transmission to the client that sent the 'joinGame' socket
//       }
//       else {
//         // TODO - log to client trying to join, room does not exist yet
//       }
//     })

//     socket.on('p1Choice', (data) => { // TODO - verify user is indeed p1 and not someone sending that socket value
//         let typeChosen = data.typeChosen;
//         rooms[data.roomUniqueId].p1Choice = typeChosen;

//         socket.to(data.roomUniqueId).emit('p1Choice'); // we only want to tell them that p1 made a choice, not the contents of the choice for security.
//         // (if sent to client side, intelligent person could view results before sending their choice)

//         if(rooms[data.roomUniqueId].p2Choice != null) {
//           declareRoundWinner(data.roomUniqueId, socket);
//       }
//     });

//     socket.on('p2Choice', (data) => { // TODO - verify user is indeed p1 and not someone sending that socket value
//       let typeChosen = data.typeChosen;
//       rooms[data.roomUniqueId].p2Choice = typeChosen;

//       socket.to(data.roomUniqueId).emit('p2Choice');
//       if(rooms[data.roomUniqueId].p1Choice != null) {
//         declareRoundWinner(data.roomUniqueId, socket);
//     }
//     });

//     socket.on('printRoomsInfo', () => {
//       printObjectProperties(rooms);
//     });

// })

// function declareRoundWinner(roomUniqueId, socket) {
//   let p1Choice = rooms[roomUniqueId].p1Choice;
//   let p2Choice = rooms[roomUniqueId].p2Choice;
//   let winner = null;
//   // This is what does the type chart calculations!!!
//   console.log("p1 chose: " + p1Choice + " and p2 chose: " + p2Choice);
//   console.log("random integer " + randomInt(rooms[roomUniqueId].typesRemaining.length));
//   // if they do not choose a type, they get a random one
//   if (p1Choice == "None" || p1Choice == null) {
//     var typesRemaining = rooms[roomUniqueId].typesRemaining;
//     var randI = randomInt(typesRemaining.length);
//     p1Choice = typesRemaining[randI];
//     rooms[roomUniqueId].p1Choice = p1Choice; // now we set the game p1Choice
//   }
//   if (p2Choice == "None" || p2Choice == null) {
//     var typesRemaining = rooms[roomUniqueId].typesRemaining;
//     var randI = randomInt(typesRemaining.length);
//     p2Choice = typesRemaining[randI];
//     rooms[roomUniqueId].p2Choice = p2Choice; // now we set the game p1Choice
//     console.log("p2 didnt choose anything, their choice is now: " + p2Choice);
//   }
//   // run the types against each other to determine who wins
//   let netScore = typeCalcs(p1Choice, p2Choice);
//   console.log("net score: " + netScore); // TODO - tiebreaker could be by how badly you were beaten (i.e. if you attack with fighting against ghost, you lose by 2 rather than by 1)
//   if (netScore > 0) {
//       rooms[roomUniqueId].p1Wins += 1;
//       winner = "p1";
//   }
//   else if (netScore < 0) {
//     rooms[roomUniqueId].p2Wins += 1;
//     winner = "p2";
//   }
//   else {
//       console.log("It is a tie!");
//       winner = "tie";
//   }
//   console.log("winner: " + winner)
//   // display to both clients the results!
//   // we need both of these to send to both clients (.to() sends to other one, plain emit() sends to one we received from)
//   socket.to(roomUniqueId).emit('matchResults', {winner: winner, p1Choice: rooms[roomUniqueId].p1Choice, p2Choice: rooms[roomUniqueId].p2Choice, p1Wins: rooms[roomUniqueId].p1Wins, p2Wins: rooms[roomUniqueId].p2Wins});
//   socket.emit('matchResults', {winner: winner, p1Choice: rooms[roomUniqueId].p1Choice, p2Choice: rooms[roomUniqueId].p2Choice, p1Wins: rooms[roomUniqueId].p1Wins, p2Wins: rooms[roomUniqueId].p2Wins});
//   // preps for next round or end the session
//   countdownAndRestartGame(3, socket, roomUniqueId);

// }

// server.listen(port, () => {
//   console.log(`Server listening on port ${port}`);
// });

// ///////////////// HELPER FUNCTIONS HERE ///////////////////////////
// // helper function to make a room id
// function makeid(length) {
//   var result           = '';
//   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//   var charactersLength = characters.length;
//   for ( var i = 0; i < length; i++ ) {
//       result += characters.charAt(Math.floor(Math.random() * charactersLength));
//   }
//   return result;
// }

// // Function to display countdown timer
// function countdownAndRestartGame(amountOfTime, socket, roomUniqueId) {
//   let count = amountOfTime;
//   const countdownInterval = setInterval(() => {
//       // Send countdown to clients
//       socket.to(roomUniqueId).emit('timer', {time: count});
//       socket.emit('timer', {time: count});

//       count--;
//       if (count < 0) {
//           clearInterval(countdownInterval);
//           restartGame(socket, roomUniqueId);
//       }
//   }, 1000);
// }

// // helper function to do type calcs
// // returns (int)netScore. (-) means p2 won, (+) means p1 won
// function typeCalcs(p1Choice, p2Choice) {
//   let netScore = 0;
//   const p1Type = pokeTypes.typedex(p1Choice, 4); // 4 is the typeDex API version.
//   const p2Type = pokeTypes.typedex(p2Choice, 4); // 4 is the typeDex API version.

//   // check p1 attacking onto p2 defending
//   if (p1Type.typemaps.gen6.attack.noEffect.includes(p2Choice)) { // p1 no effect on p2
//     netScore -= 2;
//   }
//   if (p1Type.typemaps.gen6.attack.notVeryEffective.includes(p2Choice)) { // p1 not very effective on p2
//     netScore -= 1;
//   }
//   if (p1Type.typemaps.gen6.attack.superEffective.includes(p2Choice)) { // p1 super effective on p2
//     netScore += 1;
//   }
//   // p2 attacking p1 defending
//   if (p2Type.typemaps.gen6.attack.noEffect.includes(p1Choice)) { // p2 no effect on p1
//     netScore += 2;
//   }
//   if (p2Type.typemaps.gen6.attack.notVeryEffective.includes(p1Choice)) { // p2 not very effective on p1
//     netScore += 1;
//   }
//   if (p2Type.typemaps.gen6.attack.superEffective.includes(p1Choice)) { // p2 super effective on p1
//     netScore -= 1;
//   }
//   return netScore;
// }

// function restartGame(socket, roomUniqueId) {
//   console.log("game restarted! room id: " + roomUniqueId);
//   const currRoom = rooms[roomUniqueId];
//   console.log("types remain: " + currRoom.typesRemaining);
//   // increment who won?

//   const p1Index = currRoom.typesRemaining.indexOf(currRoom.p1Choice);
//   if (p1Index !== -1) { currRoom.typesRemaining.splice(p1Index, 1); }
//   const p2Index = currRoom.typesRemaining.indexOf(currRoom.p2Choice);
//   if (p2Index !== -1) { currRoom.typesRemaining.splice(p2Index, 1); }

//   // clear p1 and p2 choices
//   currRoom.p1Choice = null;
//   currRoom.p2Choice = null;

//   const dataToEmit = { typesRemaining: currRoom.typesRemaining, p1Wins: currRoom.p1Wins, p2Wins: currRoom.p2Wins }
//   socket.to(roomUniqueId).emit('restartGame', dataToEmit); // TODO - put in some data here
//   socket.emit('restartGame', dataToEmit);
// }

// function printObjectProperties(obj, indentation = '') {
//   for (let key in obj) {
//       if (typeof obj[key] === 'object' && obj[key] !== null) {
//           console.log(indentation + key + ": ");
//           printObjectProperties(obj[key], indentation + '  ');
//       } else {
//           console.log(indentation + key + ": " + obj[key]);
//       }
//   }
// }
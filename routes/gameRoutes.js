
var express = require('express');
const router = express.Router();

const rooms = require('../socket').rooms;
const User = require('../models/User');

class Player {
    constructor(username, elo, socketId) {
        this.username = username;
        this.elo = elo;
        this.socketId = socketId; // do this for matchmaking purposes
        this.wins = 0; // default vals after:
        this.typeChoice = null; // has to start null so that it does not end the round when any player submits something
    }
}

// private games are a dictionary structure

// public games queue

// const testPlayer = new Player("Carson", 2000); 

// console.log("running game.js!!!");
// console.log('elo: ' + testPlayer.elo);

router.get('/profile', (req, res) => {
    console.log('my profile being called!');
    // ...
});

// // Default route 
// router.get('/lobby', (req, res) => {

//       // if not signed in
//       res.render('gameLobby');
    
//   });

router.get('/:gameId', (req, res) => {
    var gameId = req.params.gameId;
    console.log("game!!! " + gameId);
    // check if gameId exists as room!
    var room = rooms[gameId]
    if (room) {
        console.log('room exists!');
        if (room) {

        }
    }
    // check if both players are already connected,
        // if not, check user cookie to see if they are one of the players in the game

});

module.exports = { 
    gameRouter: router,
    Player: Player,
};
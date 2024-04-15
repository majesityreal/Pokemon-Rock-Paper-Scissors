
var express = require('express');
const router = express.Router();


router.get('/profile', (req, res) => {
    console.log('my profile being called!');
    // ...
});

router.get('/:gameId', (req, res) => {
console.log("game!!! " + req.params.gameId);
// check if gameId exists

// check if both players are already connected,
    // if not, check user cookie to see if they are one of the players in the game

});

module.exports = { 
    gameRouter: router
  };
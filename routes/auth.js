const path = require('path');
var crypto = require('crypto');
var db = require('../database');
const User = require("../models/User")

var express = require('express');
const router = express.Router();

var logger = require('morgan');
var session = require('express-session');


const loginFilePath = path.join(__dirname, '../client/login.html');
const signupFilePath = path.join(__dirname, '../client/signup.html');

router.get('/login', function(req, res, next) {
    res.sendFile(loginFilePath);
});

router.get('/signup', function(req, res, next) {
    res.sendFile(signupFilePath);
});

// router.post('/login/password', passport.authenticate('local', {
//     successRedirect: '/test',
//     failureRedirect: '/login'
//   }));

// *******
// Login route
router.post('/login', (req, res) => {
    console.log(req.body);
    credentialsAreValid()

});

// Protected dashboard route
router.get('/dashboard', isAuthenticated, (req, res) => {
    res.send('Welcome to the dashboard');
});

// Logout route
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

// Login failure route
router.get('/login-failure', (req, res) => {
    res.send('Invalid username or password');
});

// Signup route
router.post('/signup', async (req, res) => {
    try {
        const salt = crypto.randomBytes(16).toString('hex'); // Generate salt
        const hashedPassword = await new Promise((resolve, reject) => {
          crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', (err, derivedKey) => {
            if (err) reject(err); 
            resolve(derivedKey.toString('hex')); // Convert to hex
          });
        });
    
        const user = new User({
          username: req.body.username,
          password: hashedPassword,
        });
    
        await user.save(); // Save user to MongoDB
    
        // ... your login logic here ...
        res.redirect('/');
      } catch (err) {
        console.log(err); 
      }
});

router.post('/register', (req, res) => {
    console.log(req.body);
 });

// *******

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
      next();
    } else {
      res.redirect('/login');
    }
  }



// auth.js
exports.register = async (req, res, next) => {
    const { username, password } = req.body
    if (password.length < 6) {
      return res.status(400).json({ message: "Password less than 6 characters" })
    }
    try {
      await User.create({
        username,
        password,
      }).then(user =>
        res.status(200).json({
          message: "User successfully created",
          user,
        })
      )
    } catch (err) {
      res.status(401).json({
        message: "User not successful created",
        error: error.mesage,
      })
    }
  }

module.exports = router;
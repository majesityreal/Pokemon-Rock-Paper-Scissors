const path = require('path');
var crypto = require('crypto');
var db = require('../database');
const User = require("../models/User")

var express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken')
const jwtSecret = 'fea3a3cdf4dcd9c419e91f511ecea42f5be175b9de3203e9970826a9795c769ee0fd27'

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
    const { username, password } = req.body
    // Check if username and password is provided
    if (!username || !password) {
      return res.status(400).json({
        message: "Username or Password not present",
      })
    }

    

    checkCredentialsForLogin(req.body.username, req.body.password).then((user) => {
      console.log('user outside method: ' + user);
      if (user == false) {
        console.log("though shalln't enter!!");
      }
      else {
        console.log('though are entering i guess');
      }
    });

    res.redirect('/');
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
        const { username, password } = req.body
        if (!username || !password) {
          return res.status(400).json({
            message: "Username or Password not present",
          })
        }
        if (password.length < 6) {
          return res.status(400).json({ message: "Password less than 6 characters" })
        }
        const salt = crypto.randomBytes(4).toString('hex'); // Generate salt
        // chain of creating the user
        await new Promise((resolve, reject) => {
          crypto.pbkdf2(password, salt, 310000, 16, 'sha256', (err, derivedKey) => {
            if (err) reject(err); 
            resolve(derivedKey.toString('hex')); // Convert to hex
          });
        }).then(async (hash) => {
          await User.create({ // automatically saves user when you call it like this
            username: username,
            password: hash,
            salt: salt
          }).then((user) => { // putting cookie into user's browser
            const maxAge = 24 * 60 * 60;
            const token = jwt.sign( // jwt sign function takes three params 1: payload/data 2: jwtSecret 3: how long token will last
              { id: user._id, username, role: user.role }, // 1
              jwtSecret, // 2
              { expiresIn: maxAge, } // 3: 24hrs in sec
            );
            res.cookie("jwt", token, { // send generated token as a cookie to the client
              httpOnly: true,
              maxAge: maxAge * 1000, // 24hrs in ms
            });
            res.status(201).json({
              message: "User successfully created",
              user: user._id,
            });
          });
        }).catch((error) => {
          res.status(400).json({
            message: "User not successful created",
            error: error.message,
          })
        });
        // remaining login logic here:
        res.redirect('/');

      } catch (err) {
        console.log(err); 
      }
});

router.post('/register', (req, res) => {
    console.log(req.body);
 });

 router.get('/profile', isAuthenticated, (req, res) => {
    // ...
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

async function checkCredentialsForLogin(username, password) {
    try {
      console.log("Finding user " + username)
      // 1. Find the user by username
      const user = await User.findOne({ username })
      if (!user || user == null) {
        console.log('EMERGENCY MEETING NO USER FOUND')
        return false;
      }
      // 2. Hash the incoming password with the stored salt
      // we are wrapping crypto up with a promise to keep the chain of async
      await new Promise((resolve, reject) => {
        crypto.pbkdf2(password, user.salt, 310000, 16, 'sha256', (err, derivedKey) => {
          if (err) reject(err); 
          resolve(derivedKey.toString('hex')); // Convert to hex
        });
      }).then((hashedPassword) => {
          if (hashedPassword == user.password) { // 3. Compare the hashed password with the stored one
            console.log("'tis a match!");
            return user;
          }
          else { return false; }
        });
      // do extra signup stuff here?
    } catch (err) {  // Handle errors gracefully and with inner peace
      console.log("error checking credentials: " + err);
      return false;
    }
  }

function hashPassword(password, salt, callback) {
  crypto.pbkdf2(password, salt, 310000, 16, 'sha256', (err, derivedKey) => {
    if (err) {
      callback(err);  // Pass the error to the callback
    } else {
      callback(null, derivedKey.toString('hex')); // Pass null as the error, and the hashed password 
    }
  });
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
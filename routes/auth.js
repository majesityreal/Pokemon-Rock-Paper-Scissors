const path = require('path');
var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var crypto = require('crypto');
var db = require('../database');
const User = require('../database')

var logger = require('morgan');
var session = require('express-session');

// Configure Passport.js
passport.use(new LocalStrategy(function verify(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Incorrect username.' }); }

        crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', function(err, hashedPassword) { // password checking by salting and hashing
            if (err) { return cb(err); }
            if (!crypto.timingSafeEqual(user.hashed_password, hashedPassword)) {
              return done(null, false, { message: 'Incorrect username or password.' });
            }
            return done(null, user); // if here, it worked
          });
    });
}));

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
});
  
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});

var router = express.Router();

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
router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/login-failure'
    })
);

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
router.post('/signup', (req, res) => {
    console.log(req)
    console.log(req.body);
    const { username, password } = req.body;
    
    // Check if the username already exists
    User.findOne({ username: username }, (err, existingUser) => {
        if (err) {
            return res.status(500).send('Error occurred while checking username existence.');
        }
        if (existingUser) {
            return res.status(400).send('Username already exists.');
        }

        // Create a new user
        const newUser = new User({
            username: username,
            password: password
        });

        // Save the new user to the database
        newUser.save((err) => {
            if (err) {
                return res.status(500).send('Error occurred while creating user.');
            }
            res.redirect('/login'); // Redirect to login page after successful signup
        });
    });
});

// *******

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

module.exports = router;
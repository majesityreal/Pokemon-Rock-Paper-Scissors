const http = require('http');
const express = require('express')
const app = express();
const server = http.createServer(app); // create server from the app
const path = require('path');
const mongoose = require('mongoose');
const db = require('./database');
var passport = require('passport');
var session = require('express-session');

var authRouter = require('./routes/auth');
app.use('/', authRouter); // making the app use everything in our auth.js file which contains authentication routes
// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, 'client')));

// Express middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// here we just need to tell the server to listen, the other .js files handle some of the routes
server.listen(3000, () => {
    console.log(`Server listening on port ${3000}`);
  });

console.log("Hello World!");

module.exports = app;
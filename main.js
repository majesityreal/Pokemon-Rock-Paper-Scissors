require('dotenv').config(); // read .env file!
const http = require('http');
const express = require('express')
const cookieParser = require('cookie-parser')
const app = express();
app.use(cookieParser()); // it is very important it is in this order. Must use cookieParser() before creating the server!!!
app.set('view engine', 'ejs'); // Set EJS as the view engine
const server = http.createServer(app); // create server from the app
const {Server} = require('socket.io');
const io = new Server(server);
const path = require('path');
const mongoose = require('mongoose');
const db = require('./database');
var session = require('express-session');

const jwt = require('jsonwebtoken')
// adminAuth = function which ensures user is admin, userAuth same for user
const { authRouter, adminAuth, userAuth } = require("./routes/auth.js");
app.get("/admin", adminAuth, (req, res) => res.send("Admin Route")); //
app.get("/basic", userAuth, (req, res) => res.send("User Route"));


// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, 'client')));

// Express middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(session({ // this is what establishes the session
  secret: 'your_strong_secret_here', // Used for signing the session ID cookie
  resave: false, // Don't resave unchanged sessions
  saveUninitialized: false, // Don't save new sessions that have no data
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // Session expires in 1 week by default
}));
app.use(express.json()); // Parse JSON bodies (as sent by API clients)
// my middleware setup
app.use('/auth', authRouter); // Mount the auth router at a specific path

// here we just need to tell the server to listen, the other .js files handle some of the routes
server.listen(3000, () => {
    console.log(`Server listening on port ${3000}`);
  });

console.log("Hello World!");

// Default route 
app.get('/', (req, res) => {
  const token = req.cookies.jwt
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        return res.status(401).json({ message: "Not authorized" })
      } else {
        return res.render('index', { username: decodedToken.username })
      }
    });
  }
  else {
    // if not signed in
    res.render('index');
  }
  
});

// Example route to render an EJS template
app.get('/test', (req, res) => {
  res.render('index', { title: 'Express App' }); // Render 'index.ejs' with a title variable
});

module.exports = app; // this is so other files can control app settings and add routes
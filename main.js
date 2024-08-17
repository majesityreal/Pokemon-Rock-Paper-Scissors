require('dotenv').config(); // read .env file!
const http = require('http');
const express = require('express')
const cookieParser = require('cookie-parser')
const compression = require("compression");
const helmet = require("helmet");
const app = express();
// cookieParser is what lets us to req.cookies to get cookies from requests in express
app.use(cookieParser()); // it is very important it is in this order. Must use cookieParser() before creating the server!!!
app.set('view engine', 'ejs'); // Set EJS as the view engine
const httpServer = http.createServer(app); // create server from the app
const {Server} = require('socket.io');
const io = new Server(httpServer, {
  connectionStateRecovery: {
    // the backup duration of the sessions and the packets
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    // whether to skip middlewares upon successful recovery
    skipMiddlewares: true,
  }
});
module.exports = {io: io}; // exporting it here
const socket = require('./socket');

const path = require('path');
const mongoose = require('mongoose');
const db = require('./database');
var session = require('express-session');

const jwt = require('jsonwebtoken');
// adminAuth = function which ensures user is admin, userAuth same for user
const { authRouter, adminAuth, userAuth } = require("./routes/auth.js");
const { gameRouter } = require("./routes/game.js");

app.get("/admin", adminAuth, (req, res) => res.send("Admin Route")); //
app.get("/basic", userAuth, (req, res) => res.send("User Route"));
// Protected dashboard route
app.get('/dashboard', userAuth, (req, res) => {
  res.send('Welcome to the dashboard');
});

// Add helmet to the middleware chain.
// Set CSP headers to allow our Bootstrap and Jquery to be served.
// ^^ this is copied from a tutorial, idk maybe add it later
app.use(helmet());

// Set up rate limiter: maximum of twenty requests per minute
const RateLimit = require("express-rate-limit");
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
});
// Apply rate limiter to all requests
app.use(limiter);

app.use(compression()); // Compress all routes
app.use(express.static(path.join(__dirname, 'client'))); // Serve static files from the 'client' directory
app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io/client-dist')); // Serve static files from the 'node_modules' directory

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
// routers in different files
app.use('/auth', authRouter); // Mount the auth router at a specific path
app.use('/game', gameRouter);

// here we just need to tell the server to listen, the other .js files handle some of the routes
httpServer.listen(3000, () => {
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

app.get('/set-cookie', (req, res) => {
  // Set a cookie named 'myCookie' with value 'hello'
  res.cookie('testCookie', 'hello', { maxAge: 900000, httpOnly: true });
  res.send('Cookie has been set');
});

app.get('/ingame', (req, res) => {
  res.render('InGameView');
});

module.exports = {app: app, httpServer: httpServer, io: io}; // this is so other files can control app settings and add routes
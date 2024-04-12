const http = require('http');
const express = require('express')
const app = express();
const server = http.createServer(app); // create server from the app
const {Server} = require('socket.io');
const io = new Server(server);
const path = require('path');
const mongoose = require('mongoose');
const db = require('./database');
var session = require('express-session');

const authRouter = require('./routes/auth'); // the auth router

// Set EJS as the view engine
app.set('view engine', 'ejs');

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

app.post('/test', (req, res, next) => {
  console.log(req.body)
})

module.exports = app; // this is so other files can control app settings and add routes
const express = require('express');
const app = express();
const path = require('path');
const http = require('http')
const port = 3000;
// the socket.io stuff
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server);


// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, 'client')));

// Serve static files from the 'node_modules' directory
app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io/client-dist'));

// Default route 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

io.on('connection', (socket) => {
    console.log('a user has connected');
})

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

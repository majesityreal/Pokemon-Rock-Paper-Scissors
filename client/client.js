console.log('client.js executing');

var socket = io();

function createGame() {
    socket.emit('createGame')
}

function joinGame() {
    roomUniqueId = document.getElementById('roomUniqueId').value;
    socket.emit('joinGame', {roomUniqueId: roomUniqueId})
}
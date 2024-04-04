console.log('client.js executing');

const socket = io();
let roomUniqueId = null;

function createGame() {
    socket.emit('createGame')
}

function joinGame() {
    roomUniqueId = document.getElementById('roomUniqueId').value;
    socket.emit('joinGame', {roomUniqueId: roomUniqueId})
}

socket.on('newGame', (data) => {
    roomUniqueId = data.roomUniqueId;

    document.getElementById('lobbyButtons').style.display = 'none';
    document.getElementById('gamePlay').style.display = 'block';
    
    let copyButton = document.createElement('button');
    copyButton.style.display = 'block';
    copyButton.classList.add('btn','btn-primary','py-2', 'my-2')
    copyButton.innerText = 'Copy Code';
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(roomUniqueId).then(function() {
            console.log('Async: Copying to clipboard was successful!');
        }, function(err) {
            console.error('Async: Could not copy text: ', err);
        });
    });

    document.getElementById('waitingArea').innerHTML = `Waiting for opponent to join room code: ${roomUniqueId}`;
    document.getElementById('waitingArea').appendChild(copyButton);

    // TODO - make it multi page application
    // Redirect to a new page
    // window.location.href = "in-game.html";
});
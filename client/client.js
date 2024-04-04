console.log('client.js executing');

const socket = io();
let roomUniqueId = null;
let player1 = false;

function createGame() {
    player1 = true;
    console.log('creating game on client.js end!');
    socket.emit('createGame')
}

function joinGame() {
    console.log('Joining game on client.js end!');
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

    document.getElementById('waitingArea').innerHTML = `Waiting for opponent to join room code: ${roomUniqueId}. Share it with someone so they can join!`;
    document.getElementById('waitingArea').appendChild(copyButton);

    // TODO - make it multi page application
    // Redirect to a new page
    // window.location.href = "in-game.html";
});

socket.on('playersConnected', () => {
    document.getElementById('lobbyButtons').style.display = 'none';
    document.getElementById('waitingArea').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
});

socket.on('p1Choice', (data) => {
    if (!player1) {
        createOpponentChoiceButton(data);
    }
})

socket.on('p2Choice', (data) => {
    if (player1) {
        createOpponentChoiceButton(data);
    }
})

function createOpponentChoiceButton(data) {
    document.getElementById('opponentState').innerHTML = "Opponent made a choice";
}

function submitChoice() {
    console.log("submitting choice " + typeChosen); // typeChosen is from script.js. It must be included first before client.js to be accessed like this
    const choiceEvent = player1 ? "p1Choice" : "p2Choice"; // TODO - This feels wrong doing it client side, as someone could send something as p2 and p1 then!!! Have something that verifies
    socket.emit(choiceEvent, {
        typeChosen: typeChosen,
        roomUniqueId: roomUniqueId
    });
    // disable all other buttons
    const buttons = document.querySelectorAll('button.type-button:not(.selected)');
    buttons.forEach((button) => {
        button.style.display = 'none';
    });
    // disable the submit button
    document.querySelector('.submit-button').style.display = 'none';
    // TODO - other stuff to handle the choice (disable click event listener, query for opponent choice, etc)

}
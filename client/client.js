console.log('client.js executing');

const socket = io();
let roomUniqueId = null;
let player1 = false;
let hasSubmittedChoice = false;

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
});

socket.on('playersConnected', () => {
    console.log("received playersConnected socket");
    document.getElementById('lobbyButtons').style.display = 'none';
    document.getElementById('waitingArea').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
});

socket.on('p1Choice', () => {
    console.log("p1 choice socket received!!");
    if (!player1) {
        showOpponentMadeAChoice();
    }
})

socket.on('p2Choice', () => {
    console.log("p2 choice socket received!!");
    if (player1) {
        showOpponentMadeAChoice();
    }
})

socket.on('matchResults', (data) => { // when both players have made their choice
    console.log("match results data: " + data);
    console.log("winner: " + data.winner);
    if (player1) {
        showOpponentsChoice(data.p2Choice);
    }
    else if (!player1) {
        showOpponentsChoice(data.p1Choice);
    }
    displayWhoWon(data.winner);
    // create play again button
    const playAgainButton = document.createElement('button');
    playAgainButton.textContent = "Play Again";
    document.getElementById("gameArea").appendChild(playAgainButton);
    const timerNumber = document.createElement("h1");
    timerNumber.id = "timerNumber";
    document.getElementById("timerDisplay").appendChild(timerNumber);
});

socket.on('timer', (data) => {
    console.log("timer socket with time: " + data.time);
    document.getElementById("timerNumber").innerHTML = data.time;
});

socket.on('restartGame', (data) => {
    console.log("received restartGame: ");
    // TODO - everything that restarts the game
    // clear the gameArea, replace with default content in script.js
    var gameArea = document.getElementById("gameArea");
    gameArea.innerHTML = defaultGameArea;
    // now we have to add the button to game area
    const buttonContainer = document.querySelector('.button-container');
    // Creates buttons for all the types remaining for the next game
    pokemonTypes.forEach(type => {
        if (data.typesRemaining.includes(type)) {
            createTypeButton(type, buttonContainer);
        }
        else {
            createDeadTypeButton(type, buttonContainer);
        }
    });
    buttonContainer.addEventListener('click', (event) => {
        // Remove 'selected' class from any other buttons
        buttonContainer.querySelectorAll('.selected').forEach(button => {
            button.classList.remove('selected');
        });
    
        // Add 'selected' class to the clicked button
        event.target.classList.add('selected'); // TODO - this event listener activates for even the blank space. Could be inefficient
        if (event.target.textContent.length < 9) {
            sendChoice(event.target.textContent);
        }
        else { // if it is longer, we just send 'None' to server
            sendChoice("None");
        }
    });
});
function showOpponentsChoice(type) {
    console.log("type " + type);
    var divToShowResult = document.getElementById("otherPlayerChoice");
    createTypeButton(type, divToShowResult);
}

function displayWhoWon(whoWon) {
    console.log("=-= =-=");
    console.log("who won: " + whoWon);
    console.log("I am player 1? " + player1);
    var textUpdate = document.getElementById("gameStatusUpdate");
    if (whoWon == "tie") {
        textUpdate.innerHTML = "It was a tie!"
        textUpdate.style.color = "black";
    }
    else if (player1) {
        if (whoWon == "p1") {
            textUpdate.innerHTML = "You won!"
            textUpdate.style.color = "green";
        }
        else {
            textUpdate.innerHTML = "You lost!"
            textUpdate.style.color = "red";
        }
    }
    else if (!player1) {
        if (whoWon == "p2") {
            textUpdate.innerHTML = "You won!"
            textUpdate.style.color = "green";
        }
        else {
            textUpdate.innerHTML = "You lost!"
            textUpdate.style.color = "red";
        }
    }
}

function showOpponentMadeAChoice() {
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
    // document.getElementById("Button").disabled = true;

    // hide the submit button
    document.querySelector('.submit-button').style.display = 'none';
    // TODO - other stuff to handle the choice (disable click event listener, query for opponent choice, etc)
    hasSubmittedChoice = true;
}

function printRoomsInfo() {
    socket.emit('printRoomsInfo');
}
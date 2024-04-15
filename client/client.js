console.log('client.js executing');

const socket = io();
let roomUniqueId = null;
let player1 = false;
let hasSubmittedChoice = false;

// chunk of HTML where type buttons are with the submit button
var ingameMakingChoice = document.getElementById('gameArea');
var ingameDisplayRoundWinner = document.getElementById('roundWinnerArea');

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

    hide(document.getElementById('lobbyArea'));
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
    hide(document.getElementById('lobbyArea'));
    hide(document.getElementById('waitingArea'));
    ingameMakingChoice.style.display = 'block';
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
    // hide the gameArea
    hide(ingameMakingChoice)
    // show the winnerArea
    ingameDisplayRoundWinner.style.display = 'flex';
    if (player1) {
        showPlayerChoices(data.p1Choice, data.p2Choice);
        displayTypeMatchups(data.p1Choice, data.p2Choice);
    }
    else if (!player1) {
        showPlayerChoices(data.p2Choice, data.p1Choice);
        displayTypeMatchups(data.p2Choice, data.p1Choice);
    }
    // TODO - show helper. Helper indicates the type effectiveness against each other
    
    displayWhoWon(data.winner);
    displayScore(data.p1Wins, data.p2Wins);
    // create the timer and diplay it
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
    ingameMakingChoice.innerHTML = defaultGameArea;
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
function showPlayerChoices(yourType, opponentType) {
    var divToShowResult = document.getElementById("otherPlayerChoice");
    createTypeButton(opponentType, divToShowResult);
    divToShowResult = document.getElementById("yourChoice");
    createTypeButton(yourType, divToShowResult);
}

function displayTypeMatchups(yourType, opponentType) {
    var divToShowResult = document.getElementById("otherPlayerChoice");
    createTypeButton(opponentType, divToShowResult);
    divToShowResult = document.getElementById("yourChoice");
    createTypeButton(yourType, divToShowResult); // left it off here CARSON
}

function displayWhoWon(whoWon) {
    var textUpdate = document.getElementById("gameWhoWonRoundText");
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

function displayScore(p1Wins, p2Wins) {
    var scoreText = document.getElementById("gameScore");
    if (player1) {
        scoreText.innerHTML = "Your score: " + p1Wins + " Opponents score: " + p2Wins;
    }
    else if (!player1) {
        scoreText.innerHTML = "Your score: " + p2Wins + " Opponents score: " + p1Wins;
    }
}

function showOpponentMadeAChoice() {
    document.getElementById('opponentState').innerHTML = "Opponent made a choice";
}

function submitChoice() {
    // if didn't choose anything, make random choice
    if (typeChosen == "None" || typeChosen == null) {
        typeChosen = "None";
        console.log('submitting random');
    }

    console.log("submitting choice " + typeChosen); // typeChosen is from script.js. It must be included first before client.js to be accessed like this
    const choiceEvent = player1 ? "p1Choice" : "p2Choice"; // TODO - This feels wrong doing it client side, as someone could send something as p2 and p1 then!!! Have something that verifies
    socket.emit(choiceEvent, {
        typeChosen: typeChosen,
        roomUniqueId: roomUniqueId
    });
    // disable all other buttons
    const buttons = document.querySelectorAll('button.type-button:not(.selected)');
    buttons.forEach((button) => {
        hide(button);
    });
    // document.getElementById("Button").disabled = true;

    // hide the submit button
    hide(document.querySelector('.submit-button'));
    // TODO - other stuff to handle the choice (disable click event listener, query for opponent choice, etc)
    hasSubmittedChoice = true;
}

function printRoomsInfo() {
    socket.emit('printRoomsInfo');
}

function changeStylesheet() {
    var stylesheetLink = document.getElementById('stylesheet')
    if (stylesheetLink.href == "http://127.0.0.1:3000/style.css") {
        stylesheetLink.href = "http://127.0.0.1:3000/stylePlusTailwind.css"
    }
    else {
        stylesheetLink.href = "http://127.0.0.1:3000/style.css"
    }
}

function login() {
    document.getElementById('login-modal').classList.remove('hidden');
    // Close the login modal when clicking anywhere on the page
    // Add the event listener for closing on outside click
    window.addEventListener('click', loginOutsideClickListener);
}

function closeLogin() {
    document.getElementById('login-modal').classList.add('hidden');
    window.removeEventListener('click', loginOutsideClickListener);

}

function loginOutsideClickListener(event) {
    const modal = document.getElementById('login-modal');
    if (event.target === modal) {
      closeLogin();
    }
  }

function logout() {
    console.log("logout!!");
}

function openSignup() {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('signup-modal').classList.remove('hidden');
  }
  
function closeSignup() {
    document.getElementById('signup-modal').classList.add('hidden');
}

function hide(htmlElement) {
    htmlElement.style.display = 'none';
}
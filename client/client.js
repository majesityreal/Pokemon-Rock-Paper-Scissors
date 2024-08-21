console.log('client.js executing');

const socket = io();
let roomUniqueId = null;
let isPlayer1 = false;
let hasSubmittedChoice = false;

// chunk of HTML where type buttons are with the submit button
var ingameMakingChoice = document.getElementById('gameArea');
var ingameDisplayRoundWinner = document.getElementById('roundWinnerArea');
var defaultGameArea; // used to reset the game area between rounds (if modified)

function createGame() {
    isPlayer1 = true;
    console.log('creating game on client.js end!');
    socket.emit('createGame');
}

function joinGame() {
    console.log('Joining game on client.js end!');
    roomUniqueId = document.getElementById('roomUniqueId').value;
    socket.emit('joinGame', {roomUniqueId: roomUniqueId});
}

function matchmake() {
    console.log("matchmaking from client side!");
    socket.emit('matchmake');
    document.getElementById('matchmakeButton').style.display = 'none';
    document.getElementById('matchmakeLoadingButton').style.display = 'flex';
}

function cancelMatchmake() {
    socket.emit('cancelMatchmake');
    document.getElementById('matchmakeLoadingButton').style.display = 'none';
    document.getElementById('matchmakeButton').style.display = 'flex';
}

socket.on('newGame', (data) => {
    document.getElementById('userProfileSection').classList.add('hidden'); // hide login/logout
    roomUniqueId = data.roomUniqueId;

    hide(document.getElementById('lobbyArea'));
    document.getElementById('gamePlay').style.display = 'block';

    let copyButton = document.createElement('button');
    copyButton.style.display = 'block';
    copyButton.classList.add('btn','btn-primary','py-2', 'my-4', 'mx-auto');
    copyButton.innerText = 'Copy Code';
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(roomUniqueId).then(function() {
            console.log('Async: Copying to clipboard was successful!');
        }, function(err) {
            console.error('Async: Could not copy text: ', err);
        });
    });
    let waitingText = document.createElement('p');
    waitingText.classList.add('text-center', 'space-y-2');
    waitingText.innerHTML =`<div>Waiting for opponent to join room code: ${roomUniqueId}</div> <div>Share it with someone so they can join!</div>`;
    document.getElementById('waitingArea').appendChild(waitingText); 
    document.getElementById('waitingArea').appendChild(copyButton); // TODO - convert this to pure HTML, saves processing client side
});
// sets up the game view client side!
socket.on('playersConnected', (data) => {
    document.getElementById('userProfileSection').classList.add('hidden'); // hide login/logout
    console.log("received playersConnected socket");
    // This is for if players matchmake, otherwise the id is sent through (data)
    if (data && data.roomUniqueId) {
        roomUniqueId = data.roomUniqueId;
    }
    var textUpdate = document.getElementById("gameUpdateText");
    textUpdate.classList.remove('hidden');
    textUpdate.innerHTML = "Pick a type"
    hide(document.getElementById('lobbyArea'));
    hide(document.getElementById('waitingArea'));
    ingameMakingChoice.style.display = 'block';
    console.log('received playersConnected socket, cloning node')
    defaultGameArea = ingameMakingChoice.cloneNode(true); // grab default area at the very beginning so we can store it
    // Now we want to create buttons for all the types. We do this after grabbing default area because otherwise it
    pokemonTypes.forEach(type => {
        createTypeButton(type, buttonContainer);
    });
});

socket.on('setP1', () => {
    console.log("setting myself to be p1!");
    isPlayer1 = true;
})

socket.on('p1Choice', () => {
    console.log("p1 choice socket received!!");
    if (!isPlayer1) {
        showOpponentMadeAChoice();
    }
})

socket.on('p2Choice', () => {
    console.log("p2 choice socket received!!");
    if (isPlayer1) {
        showOpponentMadeAChoice();
    }
})

socket.on('matchResults', (data) => { // when both players have made their choice
    console.log("winner: " + data.winner);
    console.log("type interactrion: " + data.typeInteraction)
    // hide the gameArea - no longer doing this, but could bring it back
    //hide(ingameMakingChoice)
    // show the winnerArea
    ingameDisplayRoundWinner.classList.add('flex');
    document.getElementById("opponentChoiceDiv").classList.add("hidden");
    document.getElementById('previousRoundText').innerHTML = ""; // hide this because it is misleading
    if (isPlayer1) {
        showPlayerChoices(data.p1Choice, data.p2Choice);
        displayTypeMatchups(data.p1Choice, data.p2Choice, data.typeInteraction);
    }
    else if (!isPlayer1) {
        showPlayerChoices(data.p2Choice, data.p1Choice); // typeInteraction is the string i.e. "bg" that tells us how each type hits each other
        // we have to flip the string of typeInteractions since it returns p1,p2
        var flippedTypeInteraction = "";
        flippedTypeInteraction += data.typeInteraction[1];
        flippedTypeInteraction += data.typeInteraction[0];
        displayTypeMatchups(data.p2Choice, data.p1Choice, flippedTypeInteraction);
    }
    
    displayWhoWon(data.winner);
    displayScore(data.p1Wins, data.p2Wins);
    // create the timer and diplay it
    const timerNumber = document.createElement("h1");
    timerNumber.id = "timerNumber";
    document.getElementById("timerDisplay").appendChild(timerNumber);
});
// TODO - still needs to be fixed
socket.on('gameWon', (data) => {
    document.getElementById('userProfileSection').classList.remove('hidden'); // hide login/logout
    console.log('game won with data: ' + JSON.stringify(data));
    hide(ingameMakingChoice)
    document.getElementById('gameWinnerArea').classList.remove('hidden');
    if (data && data.winner) {
        document.getElementById('roundWinnerArea').classList.remove('hidden');
        var textUpdate = document.getElementById("gameWhoWonRoundText");
        textUpdate.classList.remove("hidden");
        var gameUpdate = document.getElementById("gameUpdateText");
        gameUpdate.classList.add("hidden");
        if (data.disconnected) {
            textUpdate.innerHTML = "Opponent disconnected. You won the game!"
            textUpdate.style.color = "green";
            document.getElementById('eloDisplayOld').innerHTML = data.winnerOldELO;
            document.getElementById('eloDisplayNew').innerHTML = data.winnerELO;
            var roundWinnerArea = document.getElementById("roundWinnerArea");
            hide(roundWinnerArea);
        }
        else if ((isPlayer1 && data.winner == 'p1') || (!isPlayer1 && data.winner == 'p2')) { // if I won
            textUpdate.innerHTML = "You won the game!"
            textUpdate.style.color = "green";
            document.getElementById('eloDisplayOld').innerHTML = data.winnerOldELO;
            document.getElementById('eloDisplayNew').innerHTML = data.winnerELO;
            showPlayerChoices(data.winnerTypeChoice, data.loserTypeChoice);
            // TODO - increment your score!!!
        }
        else { // I did not win :(
            textUpdate.innerHTML = "You lost the game! :("
            textUpdate.style.color = "red";
            document.getElementById('eloDisplayOld').innerHTML = data.loserOldELO;
            document.getElementById('eloDisplayNew').innerHTML = data.loserELO;
            showPlayerChoices(data.loserTypeChoice, data.winnerTypeChoice);
        }
    }
});

socket.on('timer', (data) => {
    console.log("timer socket with time: " + data.time);
    document.getElementById("timerNumber").textContent = data.time;
});

socket.on('restartGame', (data) => {
    console.log("received restartGame: ");
    roundWinnerAreaTypeExplanation.innerHTML = ""; // clear explanation HTML
    // document.getElementById('roundWinnerArea').innerHTML = ""; // clear roundWinnerArea
    // TODO - everything that restarts the game
    // clear the gameArea, replace with default content captured from beginning of game
    ingameMakingChoice.innerHTML = "";
    ingameMakingChoice.style.display = 'block';
    var textUpdate = document.getElementById("gameUpdateText");
    textUpdate.innerHTML = "Pick a type"
    document.getElementById('previousRoundText').innerHTML = "Previous Round:";
    console.log("html: " + defaultGameArea.innerHTML);
    ingameMakingChoice.innerHTML = defaultGameArea.innerHTML;
    document.getElementById('choiceDisplayWhileWaiting').style.display = 'none';
    document.getElementById('timerDisplay').innerHTML = ""; // clear timer

    // now we add the button to game area
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
// on initial connection, store sessionID in localStorage
socket.on("session", ({ sessionID, userID }) => {
    // attach the session ID to the next reconnection attempts
    socket.auth = { sessionID };
    // store it in the localStorage
    localStorage.setItem("sessionID", sessionID);
    // save the ID of the user
    socket.userID = userID;
});

// shows what each player chose, after round ends, while waiting for next round
function showPlayerChoices(yourType, opponentType) {
    var opponentChoiceDisplay = document.getElementById("opponentChoice");
    opponentChoiceDisplay.innerHTML = ""; // clearing the div
    createTypeButton(opponentType, opponentChoiceDisplay, 'display-only');
    // previous round display:
    var divToShowResult = document.getElementById("previousRoundYourChoice");
    divToShowResult.innerHTML = ""; // clearing the div again
    createTypeButton(opponentType, divToShowResult, 'display-only');
    divToShowResult = document.getElementById("previousRoundOpponentChoice");
    divToShowResult.innerHTML = ""; // clearing the div again again
    console.log('PLAYER CHOICES! : ')
    createTypeButton(yourType, divToShowResult, 'display-only');
}
// shows how the player's types fare against each other so ppl can learn type charts
function displayTypeMatchups(yourType, opponentType, typeInteraction) {
    // showing how they are against each other
    var divToShowExplanation = document.getElementById("roundWinnerAreaTypeExplanation");
    // interaction 1 (you vs opponent)
    var interactionDiv = document.createElement('div');
    interactionDiv.classList.add('flex', 'flex-row', 'items-center', 'py-2');
    createTypeInteractionRow(yourType, opponentType, typeInteraction[0], interactionDiv);
    divToShowExplanation.appendChild(interactionDiv);
    // interaction 2 (opponent vs you)
    interactionDiv = document.createElement('div');
    interactionDiv.classList.add('flex', 'flex-row', 'items-center', 'py-2');
    createTypeInteractionRow(opponentType, yourType, typeInteraction[1], interactionDiv);
    divToShowExplanation.appendChild(interactionDiv);
}

// helper function for displayTypeMatchups
// takes types and adds typeButton, interaction char, typeButton to 'div'
function createTypeInteractionRow(firstType, secondType, typeInteraction, div) {
    // <div> with button
    var divWithButton = document.createElement('div');
    createTypeButton(firstType, divWithButton);
    div.appendChild(divWithButton);
    // <p> element
    var p = document.createElement('p');
    p.classList.add('font-bold', 'text-center', 'sm:text-xl', 'text-lg', 'px-2');
    if (typeInteraction == "n") {
        p.innerHTML = " hits normally against";
    }
    else if (typeInteraction == "b") {
        p.innerHTML = "is <span class='text-red-400'>not very effective</span> on";
    }
    else if (typeInteraction == "g") {
        p.innerHTML = "is <span class='text-green-600'>super effective</span> on";
    }
    else if (typeInteraction == "0") {
        console.log('no effect...')
        p.innerHTML = "has <span class='text-slate-500'>no effect</span> on";
    }
    else {
        p.innerHTML = "a weird visual glitch happened here, hopefully you know the type chart LOL. Contact the devs with as much info as you can so they can fix it. Or you are viewing this because you are a programming wizard, if so congrats to you. If not, I hope we can fix this soon. Carsonic out.";
    }
    div.appendChild(p);
    // <div> with button
    divWithButton = document.createElement('div');
    createTypeButton(secondType, divWithButton);
    div.appendChild(divWithButton);
}

function displayWhoWon(whoWon) {
    var textUpdate = document.getElementById("gameWhoWonRoundText");
    textUpdate.classList.remove("hidden");
    if (whoWon == "tie") {
        textUpdate.innerHTML = "It was a tie!"
        textUpdate.style.color = "black";
    }
    else if (isPlayer1) {
        if (whoWon == "p1") {
            textUpdate.innerHTML = "Round won!"
            textUpdate.style.color = "green";
        }
        else {
            textUpdate.innerHTML = "Round lost!"
            textUpdate.style.color = "red";
        }
    }
    else if (!isPlayer1) {
        if (whoWon == "p2") {
            textUpdate.innerHTML = "Round won!"
            textUpdate.style.color = "green";
        }
        else {
            textUpdate.innerHTML = "Round lost!"
            textUpdate.style.color = "red";
        }
    }
}

function displayScore(p1Wins, p2Wins) {
    var scoreText = document.getElementById("gameScore");
    if (isPlayer1) {
        scoreText.innerHTML = "<span class='text-base'>Your score:</span> <span class='text-xl font-bold'>" + p1Wins + "</span> <span class='text-base'>Opponent's score:</span> <span class='text-xl font-bold'>" + p2Wins + "</span>";
    }
    else if (!isPlayer1) {
        scoreText.innerHTML = "<span class='text-base'>Your score:</span> <span class='text-xl font-bold'>" + p2Wins + "</span> <span class='text-base'>Opponent's score:</span> <span class='text-xl font-bold'>" + p1Wins + "</span>";
    }
}

function showOpponentMadeAChoice() {
    document.getElementById('opponentState').innerHTML = "Opponent made a choice";
}

function submitChoice() {
    // if didn't choose anything, make random choice 
    if (typeChosen == null) {
        typeChosen = "None";
    }

    console.log("submitting choice " + typeChosen); // typeChosen is from script.js. It must be included first before client.js to be accessed like this
    const choiceEvent = isPlayer1 ? "p1Choice" : "p2Choice"; // TODO FIXME - This feels wrong doing it client side, as someone could send something as p2 and p1 then!!! Have something that verifies
    socket.emit(choiceEvent, {
        typeChosen: typeChosen,
        roomUniqueId: roomUniqueId
    });
    // disable all type buttons except those for dispaly
    const buttons = document.querySelectorAll('button.type-button:not(.display-only)');  // disabling normal buttons, and not the previous round choice ones which are marked 'display-only'
    buttons.forEach((button) => {
        hide(button);
    });
    // display your type chosen while waiting
    var DIVchoiceDisplayWhileWaiting = document.getElementById('choiceDisplayWhileWaiting');
    DIVchoiceDisplayWhileWaiting.style.display = 'flex';
    var BUTTONchoiceDisplayWhileWaiting = DIVchoiceDisplayWhileWaiting.querySelector('.playerChoice')
    createTypeButton(typeChosen, BUTTONchoiceDisplayWhileWaiting);

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

function logout() {
    window.location.href = '/auth/logout';
}

function returnToLobby() {
    window.location.href = "";
}

function hide(htmlElement) {
    htmlElement.style.display = 'none';
}
// first one is 999 instead of 1000 bc I use '>' in checking function and do not want a special case >= for beginning of bin
const eloBins = [[999, 1100], [1100, 1200], [1200, 1300], [1300, 1400], [1400, 1500],
     [1500, 1600], [1600, 1700], [1700, 1800], [1800, 1900], [1900, 2000], [2000, 4000]];

// Define the EloQueue class to represent a queue for a specific ELO range
class EloQueue {
    constructor() {
        this.players = [];
    }

    // add a player to the queue
    addPlayer(player) {
        this.players.push(player);
    }
    // removes + returns first player from queue
    getNextPlayer() {
        if (this.players.length > 0) {
            return this.players.pop();
        }
        else {
            return null;
        }
    }

    removePlayer(player) {
        let pIndex = this.players.indexOf((playerInQueue) => {
            return playerInQueue.username == player.username;
        });
        if (pIndex == -1) { // player not in queue!
            return false;
        }
        let removedPlayer = this.players.splice(pIndex, 1);
        console.log("removed player " + JSON.stringify(removedPlayer));
    }

    // Method to find a match for a player within this queue or neighboring queues
    findMatch(player) {
        // Logic for finding a match goes here
    }
}

// Define the MatchmakingSystem class to manage the matchmaking process
class MatchmakingSystem {
    constructor() {
        this.queues = []; // Dictionary to store queues based on ELO range
        for (let i = 0; i < eloBins.length; i++) { // create EloQueues
            this.queues[i] = new EloQueue();
        }
    }

    // Method to add a player to the appropriate queue based on their ELO rating
    addPlayerToQueue(player, eloRating) {
        const eloBin = getEloBinIndex(eloRating); // Function to determine ELO range
        if (!this.queues[eloBin]) {
            console.error("error: tried to add player to bin " + eloBin + " with elo rating " + eloRating);
        }
        this.queues[eloBin].addPlayer(player);
    }

    // Method to find a match for a player based on their ELO rating
    findMatchForPlayer(player, eloRating) {
        const eloBin = getEloBinIndex(eloRating);
        if (this.queues[eloBin]) {
            return this.queues[eloBin].getNextPlayer(player);
        } else {
            return null; // No players in this ELO range
        }
    }
}

// returns index of EloQueue in MatchmakingSystem based on eloRating.
// currently the bin difference is 100, in the future splice into 50 if more popular
function getEloBinIndex(eloRating) {
    for (let i = 0; i < eloBins.length; i++) {
        if (eloRating > eloBins[i][0] && eloRating <= eloBins[i][1]) {
            return i;
        }
    }
}

// Example usage:
const matchmakingSystem = new MatchmakingSystem();
const player1 = "Player1";
const player2 = "Player2";
const eloRatingPlayer1 = 1201;
const eloRatingPlayer2 = 1250;

matchmakingSystem.addPlayerToQueue(player1, eloRatingPlayer1);
matchmakingSystem.addPlayerToQueue(player2, eloRatingPlayer2);

const match = matchmakingSystem.findMatchForPlayer(player1, eloRatingPlayer1);
if (match) {
    console.log("Match found:", match);
} else {
    console.log("No match found for", player1);
}

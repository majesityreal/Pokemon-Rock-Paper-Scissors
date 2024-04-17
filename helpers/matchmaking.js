// first one is 999 instead of 1000 bc I use '>' in checking function and do not want a special case >= for beginning of bin
const eloBins = [[999, 1100], [1100, 1200], [1200, 1300], [1300, 1400], [1400, 1500],
     [1500, 1600], [1600, 1700], [1700, 1800], [1800, 1900], [1900, 2000], [2000, 4000]];

     // MatchmakingSystem class to manage the matchmaking process
// 'player' is the username of the player!!!
class MatchmakingSystem {
    constructor() {
        this.queues = []; // Dictionary to store queues based on ELO range
        for (let i = 0; i < eloBins.length; i++) { // create EloQueues
            this.queues[i] = new EloQueue();
        }
    }

    // Method to add a player to the appropriate queue based on their ELO rating
    // addPlayerToQueue(player, eloRating) {
    //     const eloBin = getEloBinIndex(eloRating); // Function to determine ELO range
    //     if (!this.queues[eloBin]) {
    //         console.error("error: tried to add player to bin " + eloBin + " with elo rating " + eloRating);
    //     }
    //     this.queues[eloBin].addPlayer(player);
    // }

    // Method to find a match for a player based on their ELO rating
    // returns 'username' of player if found, false if did not match up players, or null if there was an error with eloBin
    findMatchForPlayer(player, eloRating) {
        const eloBinIndex = getEloBinIndex(eloRating);
        console.log('finding match with eloBinIndex: ' + eloBinIndex);
        const eloBin = this.queues[eloBinIndex];
        console.log('finding match with eloBin: ' + JSON.stringify(eloBin));
        console.log('eloBin players length: ' + eloBin.players.length);
        let opponent = this.checkBin(eloBin);
        console.log("opponent was: " + JSON.stringify(opponent));
        if (opponent == false) { // adds player to bin if nobody is in it
            console.log("did not find anybody, adding myself to bin " + JSON.stringify(player));
            this.queues[eloBinIndex].addPlayer(player);
        }
        console.log('returning opponent: ' + JSON.stringify(opponent));
        return opponent;
    }
    // this one is used for outer search, does not add player into another bin queue
    findMatchExtendedBins(player, eloRating, numberOfBinsOutside) {
        const eloBinIndex = getEloBinIndex(eloRating);
        let upperEloBinIndex = Math.min(eloBinIndex + numberOfBinsOutside, this.queues.length - 1); // use min to ensure upper bound
        let lowerEloBinIndex = Math.max(eloBinIndex - numberOfBinsOutside, 0); // use max to ensure lower bound
        const upperEloBin = this.queues[upperEloBinIndex];
        const lowerEloBin = this.queues[lowerEloBinIndex];
        let lowerPlayer = this.checkBin(lowerEloBin);
        if (lowerPlayer) {
            return lowerPlayer;
        }
        let upperPlayer = this.checkBin(upperEloBin);
        if (upperPlayer) {
            return upperPlayer;
        }
        // if we reach here, there was nobody in either bin
        return false;
    }
    // returns false if nobody is in bin, Player object if in bin, and null if bin does not exist
    checkBin(eloBin) {
        console.log("elo bin is being called with bin: " + JSON.stringify(eloBin));
        // checking lower bin first
        if (eloBin.players) {
            // if it is empty, add player to list, otherwise get the player
            if (eloBin.players.length == 0) {
                return false; // false indicates that nobody is in the bin
            }
            else {
                return eloBin.getNextPlayer();
            }
        } else {
            console.log("no bin found for elo bin: " + eloBin);
            return null; // Error: No bins created for this ELO range
        }
    }
    removePlayerFromMatchmaking(player) {
        const eloBin = getEloBinIndex(player.elo);
        return queues[eloBin].removePlayer(player);
    }
}

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
    // if they disconnect, for example
    removePlayer(player) {
        let pIndex = this.players.indexOf((playerInQueue) => {
            return playerInQueue.username == player.username;
        });
        if (pIndex == -1) { // player not in queue!
            return false;
        }
        let removedPlayer = this.players.splice(pIndex, 1);
        console.log("removed player from eloBin " + JSON.stringify(removedPlayer));
    }
}

// returns index of EloQueue in MatchmakingSystem based on eloRating.
// currently the bin difference is 100, in the future splice into 50 if more popular
function getEloBinIndex(eloRating) {
    if (eloRating < 1000) { // min size
        return 0;
    }
    else if (eloRating > 3000) { // max size
        return eloBins[eloBins.length - 1];
    }
    for (let i = 0; i < eloBins.length; i++) {
        if (eloRating > eloBins[i][0] && eloRating <= eloBins[i][1]) {
            return i;
        }
    }
    console.log("getEloBinIndex reached end of for loop, returning 0 I guess");
    // it should not get here
    return 0; // this is when it errors, by default you should face off against default players (bin 0)
}

module.exports = {
    MatchmakingSystem: MatchmakingSystem,
}

// Example usage:
// const matchmakingSystem = new MatchmakingSystem();
// const player1 = "Player1";
// const player2 = "Player2";
// const eloRatingPlayer1 = 1201;
// const eloRatingPlayer2 = 1250;

// matchmakingSystem.addPlayerToQueue(player1, eloRatingPlayer1);
// matchmakingSystem.addPlayerToQueue(player2, eloRatingPlayer2);

// const match = matchmakingSystem.findMatchForPlayer(player1, eloRatingPlayer1);
// const match2 = matchmakingSystem.findMatchForPlayer(player1, eloRatingPlayer1);
// if (match2) {
//     console.log("Match found:", match2);
// } else {
//     console.log("No match found for", player1);
// }
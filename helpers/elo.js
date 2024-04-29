var k = 32;
function getRatingDelta(myRating, opponentRating, myGameResult) {
    if ([0, 0.5, 1].indexOf(myGameResult) === -1) {
      return null;
    }
    
    var myChanceToWin = 1 / ( 1 + Math.pow(10, (opponentRating - myRating) / 400));

    return Math.round(k * (myGameResult - myChanceToWin));
  }

function getNewRating(myRating, opponentRating, myGameResult) {
    // floors rating at 1000 so people do not go below
    return Math.max(1000, myRating + getRatingDelta(myRating, opponentRating, myGameResult));
}

module.exports.getNewRating = getNewRating;
// splits cookies into (key, value) pairs
function parseCookies(cookieString) {
    if (cookieString) {
      return cookieString.split(';').reduce((cookies, cookie) => {
        const [name, value] = cookie.trim().split('=');
        cookies[name] = value;
        return cookies;
      }, {});
    }
    else {
      return false;
    }
  }

function printObjectProperties(obj, indentation = '') {
  if (Object.keys(obj).length === 0) {
    console.log('rooms dict is empty!!!');
    return;
  }
  for (let key in obj) {
      if (key == 'typesRemaining') {
        let typeString = '';
        for (let i = 0; i < obj[key].length; i++) {
          typeString += obj[key][i] + ' ';
        }
        console.log(indentation + key + ": " + typeString);
      }
      else if (typeof obj[key] === 'object' && obj[key] !== null) {
          console.log(indentation + key + ": ");
          printObjectProperties(obj[key], indentation + '  ');
      } else {
          console.log(indentation + key + ": " + obj[key]);
      }
  }
}

const pokeTypes = require('dismondb'); // pokemon type chart calc library
// helper function to do type calcs
// returns (int)netScore. (-) means p2 won, (+) means p1 won
// also returns typeInteraction string, first letter is p1 second is p2
// i.e. "0g" p1 no effect, p2 super effective
function typeCalcs(p1Choice, p2Choice) {
  let netScore = 0;
  let typeInteraction = ""; // codes: {0: no effect, b: not very effective, g: super effectie, n: neutral hit}
  const p1Type = pokeTypes.typedex(p1Choice, 4); // 4 is the typeDex API version.
  const p2Type = pokeTypes.typedex(p2Choice, 4); // 4 is the typeDex API version.

  // check p1 attacking onto p2 defending
  if (p1Type.typemaps.gen6.attack.noEffect.includes(p2Choice)) { // p1 no effect on p2
    netScore -= 2;
    typeInteraction += "0"
  }
  else if (p1Type.typemaps.gen6.attack.notVeryEffective.includes(p2Choice)) { // p1 not very effective on p2
    netScore -= 1;
    typeInteraction += "b"
  }
  else if (p1Type.typemaps.gen6.attack.superEffective.includes(p2Choice)) { // p1 super effective on p2
    netScore += 1;
    typeInteraction += "g"
  }
  else {
    typeInteraction += "n"
  }
  // p2 attacking p1 defending
  if (p2Type.typemaps.gen6.attack.noEffect.includes(p1Choice)) { // p2 no effect on p1
    netScore += 2;
    typeInteraction += "0"
  }
  else if (p2Type.typemaps.gen6.attack.notVeryEffective.includes(p1Choice)) { // p2 not very effective on p1
    netScore += 1;
    typeInteraction += "b"
  }
  else if (p2Type.typemaps.gen6.attack.superEffective.includes(p1Choice)) { // p2 super effective on p1
    netScore -= 1;
    typeInteraction += "g"
  }
  else {
    typeInteraction += "n"
  }
  return { score: netScore, typeInteraction: typeInteraction };
}
  
module.exports = {
  parseCookies,
  printObjectProperties,
  typeCalcs
}
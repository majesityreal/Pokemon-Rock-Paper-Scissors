const http = require('http');
const pokeTypes = require('dismondb')

console.log("Hello World!");

const hostname = '127.0.0.1'; // Localhost
const port = 3000;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World!\n');
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

const fireType = pokeTypes.typedex("Fire", 4);
console.log(fireType.typemaps.gen6.attack);
console.log('break')
console.log(fireType.typemaps.gen6.defence);

let p1Choice = "Fighting"
let p2Choice = "Normal"
let netScore = 0; // if positive p1 wins, if negative p2 wins

const p1Type = pokeTypes.typedex(p1Choice, 4); // 4 is the typeDex API version.
const p2Type = pokeTypes.typedex(p2Choice, 4); // 4 is the typeDex API version.

// check p1 attacking onto p2 defending
console.log(p1Type.typemaps.gen6.attack);
if (p1Type.typemaps.gen6.attack.noEffect.includes(p2Choice)) {
    console.log("P1 no effect on P2");
    netScore -= 2;
}
if (p1Type.typemaps.gen6.attack.notVeryEffective.includes(p2Choice)) {
  console.log("P1 not very effective hit on P2");
  netScore -= 1;
}
if (p1Type.typemaps.gen6.attack.superEffective.includes(p2Choice)) {
  console.log("P1 SUPER effective hit on P2");
  netScore += 1;
}
// p2 attacking p1 defending
if (p2Type.typemaps.gen6.attack.noEffect.includes(p1Choice)) {
    console.log("P2 no effect on p1");
    netScore += 2;
}
if (p2Type.typemaps.gen6.attack.notVeryEffective.includes(p1Choice)) {
    console.log("P2 not very effective hit on p1");
    netScore += 1;
}
if (p2Type.typemaps.gen6.attack.superEffective.includes(p1Choice)) {
    console.log("P2 SUPER effective hit on p1");
    netScore -= 1;
}

console.log("net score: " + netScore);
if (netScore > 0) {
    console.log("player 1 wins!")
}
else if (netScore < 0) {
    console.log("player 2 wins!")
}
else {
    console.log("It is a tie!")
}
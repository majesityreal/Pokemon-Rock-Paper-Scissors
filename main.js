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
console.log(fireType.typemaps.gen6);
console.log(fireType.typemaps.gen6.attack);
console.log(fireType.typemaps.gen6.defence);
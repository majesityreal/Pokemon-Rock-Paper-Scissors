# Known Bugs:
## Login Form bug
Login form has extra margins on left and right side. It is 3 nested <div> and that is likely why.
Issue bc if you click outside login popup, it closes it unless you click on these horizontal margins. Cannot figure out how to fix, minor bug as it does not significantly impact functionality

# How to run!
Put one foot in front of the other quickly, one foot always must be off the ground... Oh you meant running the project? Ok well for that, you need to:
node main.js
^^ plain old vanilla way of running
npm run dev
^^ runs the dev environment. Replace with other environments.

# Stuff this project uses, keywords and all that jazz
Node.js backend, Express for the routes and stuff
express-session for session management
socket.io for the game itself
cookie-parser package for cookies
mongoose / MongoDB for database CRUD operations NoSQL
Http GET,POST operations
jwt - jason web tokens to store temp user info
## Things helpful in prod:
compression - to compress HTTP response sent to client, reducing loading time
helmet - protects against well-known vulnerabilities
express-rate-limit - protect against DOS attacks or brute force attacks

dotenv - to read from .env file

# TODO for production!!!!
Set up separate testing and production mongoDB!!!!!!
Fix hiding DOM elements. Either use: display: block and display: none or hidden class. Refactor everything to use the hidden class or not

# Future developer:
## VSCode
Install PostCSS to read the stuff that Tailwind adds on compiling
Also install _______________ for the EJS support

# Subfolder explanation

## /views
Handles the "views" or the client side display. A view can be an entirely separate page (i.e. index.ejs) or a smaller component (views/loginPopup.ejs)

## /routes
Handles all routing related stuff.
auth.js = handles logging in/signing up/ logging out
game.js = handles game related routes (creating, joining, re-connecting)

## /client
Everything related to the client, CSS stylesheets, displaying stuff, client-side rendering, etc.

## /helpers
Smaller helper components. This is for stuff that could be used in any project, a mini modular library if you will. 
elo.js handles ELO calculation of matches
matchmaking.js handles... well... matchmaking. I wrote it because I couldn't find a matchmaking library that was suited to fit this project

## /models
Database models for MongoDB

# Website
Currently hosted on https://pokemon-rock-paper-scissors-production.up.railway.app/
var express = require('express');
const router = express.Router();

const path = require('path');
var crypto = require('crypto');
const jwt = require('jsonwebtoken')

var db = require('../database');
// const User = require("../models/User").User;
const { User, getElo, updateElo, getUserByUsername } = require('../models/User');

const loginFilePath = path.join('login.ejs');
const signupFilePath = path.join(__dirname, 'signup.ejs');

const cookieMaxAge = 24 * 60 * 60; // 24 hours in seconds

router.get('/login', function(req, res, next) {
    res.render(loginFilePath);
});

router.get('/signup', function(req, res, next) {
    res.render(signupFilePath);
});

// *******
// Login route
router.post('/login', (req, res) => {
    const { username, password } = req.body
    // Check if username and password is provided
    if (!username || !password) {
      console.log('did the thing')
      return res.status(400).json({
        message: "Username or Password not present",
      })
    }    
    checkCredentialsForLogin(username, password).then((user) => {
      if (user == false || user == null) {
        return res.status(400).json({ errorMessage: "Something went wrong in login process, refresh and try again" });
      }
      else if (user.status == 400) {
        return res.status(400).json({ errorMessage: user.message });
      }
      else {
          const token = jwt.sign(
            { id: user._id, username: username, role: user.role },
            process.env.JWT_SECRET,
            {
              expiresIn: cookieMaxAge, // 3hrs in sec
            }
          );
          res.cookie("jwt", token, {
            httpOnly: true,
            maxAge: cookieMaxAge * 1000, // 3hrs in ms
          });
          return res.status(200).json("");
      }
    });
    // res.redirect('/'); // if you call res.redirect, it sends headers to the client before the promise is finished!!!!! this took me 30 minutes to debug OOF!!
});

router.get("/logout", (req, res) => {
  res.cookie("jwt", "", { maxAge: "1" })
  res.redirect("/")
})

// Login failure route
router.get('/login-failure', (req, res) => {
    res.send('Invalid username or password');
});

// Signup route
router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body
        if (!username || !password) {
          return res.status(400).json({
            errorMessage: "Username or Password not present",
          })
        }
        if (password.length < 6) {
          return res.status(400).json({ errorMessage: "Password less than 6 characters" })
        }
        const salt = crypto.randomBytes(4).toString('hex'); // Generate salt
        // chain of creating the user
        await new Promise((resolve, reject) => {
          crypto.pbkdf2(password, salt, 310000, 16, 'sha256', (err, derivedKey) => {
            if (err) reject(err); 
            resolve(derivedKey.toString('hex')); // Convert to hex
          });
        }).then(async (hash) => {
          await User.create({ // automatically saves user when you call it like this
            username: username,
            password: hash,
            salt: salt
          }).then((user) => { // putting cookie into user's browser
            const token = jwt.sign( // jwt sign function takes three params 1: payload/data 2: jwtSecret 3: how long token will last
              { id: user._id, username: username, role: user.role }, // 1
              process.env.JWT_SECRET, // 2
              { expiresIn: cookieMaxAge, } // 3: 24hrs in sec
            );
            res.cookie("jwt", token, { // send generated token as a cookie to the client
              httpOnly: true,
              maxAge: cookieMaxAge * 1000, // 24hrs in ms
            });
            res.status(200).json({
              message: "User successfully created",
              user: user._id,
            });
          });
        }).catch((error) => {
          res.status(400).json({
            errorMessage: "Username already taken",
            error: error.message,
          })
        });
        // remaining signup logic here:

      } catch (err) {
        console.log(err); 
      }
});

router.post('/register', (req, res) => {
    console.log(req.body);
 });

// *******

async function checkCredentialsForLogin(username, password) {
    try {
      console.log("Finding user " + username)
      // 1. Find the user by username      
      const user = await getUserByUsername(username);
      if (!user || user == null) {
        console.log("lol i am so silly I could not find user")
        return {status: 400, message: 'Username not found'};
      }
      // 2. Hash the incoming password with the stored salt
      // we are wrapping crypto up with a promise to keep the chain of async
      return await new Promise((resolve, reject) => {
        crypto.pbkdf2(password, user.salt, 310000, 16, 'sha256', (err, derivedKey) => {
          if (err) reject(err); 
          resolve(derivedKey.toString('hex')); // Convert to hex
        });
      }).then((hashedPassword) => {
          if (hashedPassword == user.password) { // 3. Compare the hashed password with the stored one
            return user;
          }
          else { return {status: 400, message: 'Incorrect password'}; }
        });
      // do extra signup stuff here?
    } catch (err) {  // Handle errors gracefully and with inner peace
      console.log("error checking credentials: " + err);
      return false;
    }
  }

var adminAuth = (req, res, next) => {
  const token = req.cookies.jwt
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        return res.status(401).json({ message: "Not authorized" })
      } else {
        if (decodedToken.role !== "admin") {
          return res.status(401).json({ message: "Not authorized" })
        } else {
          next()
        }
      }
    });
  } else {
    return res
      .status(401)
      .json({ message: "Not authorized, token not available" })
  }
}

var userAuth = (req, res, next) => {
  if (req.cookies == null) {
    return res.status(401).json({
       message: "You have no cookies with you" 
      })
  }
  const token = req.cookies.jwt
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        return res.status(401).json({ message: "Not authorized" })
      } else {
        if (decodedToken.role !== "Basic") {
          return res.status(401).json({ message: "Not authorized" })
        } else {
          next()
        }
      }
    });
  } else {
    return res
      .status(401)
      .json({ message: "Not authorized, token not available" })
  }
}

router.get('/profile', userAuth, (req, res) => {
  console.log('my profile being called!');
  // ...
});

// grabs the username from jwt cookie
// takes in jwtToken
// outputs either username as string, or boolean false
function getUsernameFromJwt(jwtToken) {
  let returnVal = false;
  if (jwtToken) {
    jwt.verify(jwtToken, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        console.log('crashed getting username from jwt token on getUsername method. idk what happened');
        return;
      } else {
        returnVal = decodedToken.username;
      }
    });
  }
  return returnVal; // returns false if no token
}

// grabs all the information from jwt cookie
// takes in jwtToken
// outputs either info as object, or boolean false
function getInfoFromJwt(jwtToken) {
  let returnVal = false;
  if (jwtToken) {
    jwt.verify(jwtToken, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        console.log('crashed getting username from jwt token on getUsername method. idk what happened');
        return;
      } else {
        returnVal = decodedToken;
      }
    });
  }
  return returnVal; // returns false if no token
}

// splits cookies into (key, value) pairs
function parseCookies(cookieString) {
  return cookieString.split(';').reduce((cookies, cookie) => {
      const [name, value] = cookie.trim().split('=');
      cookies[name] = value;
      return cookies;
  }, {});
}


module.exports = { 
  authRouter: router, adminAuth: adminAuth, userAuth: userAuth, getUsernameFromJwt: getUsernameFromJwt
};

module.exports.getInfoFromJwt = getInfoFromJwt;
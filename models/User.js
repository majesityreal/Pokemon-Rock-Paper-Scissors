// user.js
const Mongoose = require("mongoose")
const UserSchema = new Mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    minlength: 6,
    required: true,
  },
  role: {
    type: String,
    default: "Basic",
    required: true,
  },
  salt: {
    type: String,
    required: true
  },
  elo: {
    type: Number,
    default: 1000,
    validate: {
      validator: Number.isInteger,
      message: 'ELO must be an integer'
  }
  }
})

async function getElo(userId) {
  try {
    // Find the user by ID and select only the 'elo' field
    const user = await User.findById(userId).select('elo'); 
    if (user) {
      return user.elo;
    } else {
      console.error("User not found");
      return 999;  // Or handle the error as needed // FIXME - check this for errors. making it return 999
    }
  } catch (error) {
    console.error("Error getting ELO:", error);
  }
}

async function updateElo(username, newElo) {
  try {

    // Find and update the user
    const updatedUser = await User.findOneAndUpdate(
        { username: username },
        { elo: newElo }, 
        { new: true } // Option to return the updated document
    );
    if (updatedUser) {
      console.log("ELO updated successfully. New ELO:", updatedUser.elo);
      return updatedUser; 
    } else {
      console.error("User not found");
      return null;  // Or handle the error as needed
    }
  } catch (error) {
    console.error("Error updating ELO:", error);
  }
}

async function getUserByUsername(username) {
  try {
    // Find the user by username
    const user = await User.findOne({ username: username });

    if (user) {
      console.log("Found user:", user);
      return user;
    } else {
      console.error("User not found");
      return null;  // Or handle the error as needed
    }
  } catch (error) {
    console.error("Error finding user by username:", error);
    // Handle the error appropriately 
  }
}

// GEMINI gives this as an option: I can put a limit on the waiting so that I do not have user sit there forever waiting for DB. If not within 5 seconds, quit??
// async function getUserByUsername(username, timeout = 5000) { // Default timeout 5 seconds
//   try {
//     // Connect to your MongoDB database (if not already connected)
//     await mongoose.connect('your_mongodb_connection_string');

//     // Set up a promise for the query
//     const queryPromise = User.findOne({ username: username });

//     // Create a timeout promise
//     const timeoutPromise = new Promise((resolve, reject) => {
//         setTimeout(() => {
//             reject(new Error('Timeout exceeded while finding user by username'));
//         }, timeout);
//     });

//     // Race the promises (see which one finishes first)
//     const user = await Promise.race([queryPromise, timeoutPromise]);

//     console.log("Found user:", user);
//     return user;

//   } catch (error) {
//     console.error("Error finding user by username:", error);
//     throw error; // Re-throw to allow for upstream error handling
//   } finally {
//     // Close the Mongoose connection (optional, but good practice)
//     await mongoose.disconnect();
//   }
// }

// // Usage:
// const targetUsername = 'example_username';
// getUserByUsername(targetUsername)
//     .then(user => {
//         // Handle successful user retrieval
//     })
//     .catch(error => {
//         // Handle errors, including timeout
//     });

// Create a User model
const User = Mongoose.model('User', UserSchema); // this binds the schema to a database. Now we can use User as a constructor
module.exports = { User: User, getElo: getElo, updateElo: updateElo, getUserByUsername, getUserByUsername }
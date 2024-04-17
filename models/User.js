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

// Create a User model
const User = Mongoose.model('User', UserSchema); // this binds the schema to a database. Now we can use User as a constructor
module.exports = { User: User, getElo: getElo }
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
  }
})

// Create a User model
const User = Mongoose.model('User', UserSchema); // this binds the schema to a database. Now we can use User as a constructor
module.exports = User
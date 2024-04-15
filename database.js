const mongoose = require('mongoose');
const User = require("./models/User")

// Connect to MongoDB
async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error('Error connecting to MongoDB: ', error);
    }
}

const db = mongoose.connection;
db.on('error', () => {
    console.error.bind(console, 'MongoDB connection error:')
    return; // FIXME we return, before it was throwing a double error so it might be connecting twice?
});

// Function to create a new user
async function createUser(username, password) {
    try {
        const newUser = new User({ username, password });
        await newUser.save();
        console.log('User created successfully');
    } catch (error) {
        console.error('Error creating user:', error);
    }
}

// Connect to the database
connectToDatabase()
    .catch(console.error);

module.exports = db;
module.exports = { connectToDatabase }
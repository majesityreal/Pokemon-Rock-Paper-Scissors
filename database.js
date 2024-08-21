const mongoose = require('mongoose');
const User = require("./models/User")

// Connect to MongoDB
async function connectToDatabase() {
    try {
        console.log("MONGODB URL: " + process.env.MONGODB_URL)
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

// Connect to the database
connectToDatabase()
    .catch(console.error);

module.exports = db;
module.exports = { connectToDatabase }
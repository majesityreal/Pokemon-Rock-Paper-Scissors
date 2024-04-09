const mongoose = require('mongoose');

// Connect to MongoDB
async function connectToDatabase() {
    try {
        await mongoose.connect('mongodb+srv://carsonic:!Aulani1084@pokemonrps.j0m63k8.mongodb.net/?retryWrites=true&w=majority&appName=PokemonRPS');
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error('Error connecting to MongoDB: ', error);
    }
}

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
// Create a User model
const User = mongoose.model('User', userSchema); // this binds the schema to a database. Now we can use User as a constructor

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

module.exports = User; // Export the User model
module.exports = db;
module.exports = { connectToDatabase }
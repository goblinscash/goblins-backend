const mongoose = require('mongoose');

const connectToDatabase = async() => {
    const mongoUri = "mongodb+srv://goblins-prod:H7NnZ5dr64aQ5OR3@cluster0.0rlx7.mongodb.net/farm"
    // "mongodb+srv://ashutoshsuffescom8:jKSaIwqbZxOlo2oi@farm.mug2e.mongodb.net/farm"
    try {
        await mongoose.connect(mongoUri);
        console.log("Goblins connected to its database.")
    } catch (error) {
        console.log(error)
    }
}

module.exports = connectToDatabase;
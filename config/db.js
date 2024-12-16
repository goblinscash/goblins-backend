const mongoose = require('mongoose');

const connectToDatabase = async() => {
    const mongoUri = "mongodb+srv://ashutoshsuffescom8:jKSaIwqbZxOlo2oi@farm.mug2e.mongodb.net/"
    try {
        await mongoose.connect(mongoUri);
        console.log("Goblins connected to its database.")
    } catch (error) {
        console.log(error)
    }
}

module.exports = connectToDatabase;
// src/config/db.config.js

const mongoose = require('mongoose');
require('dotenv').config(); 

const connectDB = async () => {
    const MONGO_URL=process.env.MONGO_URL

    if (!MONGO_URL) {
        console.error("❌ FATAL ERROR: MONGO_URL environment variable is not defined.");
        process.exit(1); 
    }

    try {
        await mongoose.connect(MONGO_URL, {

            serverSelectionTimeoutMS: 5000, 
        });

        console.log('MongoDB connected successfully!');
        
    } catch (error) {
        console.error(`MongoDB connection failed: ${error.message}`);
        // Exit the process if the connection fails
        process.exit(1);
    }
};

module.exports = connectDB;
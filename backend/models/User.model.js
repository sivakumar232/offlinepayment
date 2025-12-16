// src/models/User.model.js

const mongoose = require('mongoose');

// Define the Mongoose Schema for the 'users' collection
const UserSchema = new mongoose.Schema({
    // user_id: Generated sequentially, required for the external API response
    user_id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true, // Allows null values but enforces uniqueness for non-nulls
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'BLOCKED'],
        default: 'ACTIVE',
    },
}, {
    // Mongoose automatically adds createdAt and updatedAt fields
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Create the model
const User = mongoose.model('User', UserSchema);

module.exports = User;
// src/controllers/user.controller.js
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User.model');

module.exports = (context) => {
    const createUser = async (req, res) => {
        const { name, phone, email } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ error: 'Name and phone are required' });
        }
        
        try {
            // 🚀 GENERATE RANDOM ID (8 chars is enough for hackathon)
            const newUserId = `U-${uuidv4().substring(0, 8).toUpperCase()}`;

            const newUser = new User({
                user_id: newUserId,
                name: name,
                phone: phone,
                email: email,
                status: "ACTIVE",
            });

            const savedUser = await newUser.save();
            
            return res.status(201).json({
                user_id: savedUser.user_id,
                message: "User created successfully"
            });

        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({
                    error: "User with this phone or email already exists.",
                    detail: error.message,
                });
            }
            return res.status(500).json({
                error: "Internal Server Error during user creation.",
                detail: error.message
            });
        }
    };

    return { createUser };
};
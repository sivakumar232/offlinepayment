// src/controllers/user.controller.js (Updated for Mongoose)

const User = require('../models/User.model');
// We still need the global counters to generate sequential IDs (U1001, U1002, etc.)
// In a highly-scalable production system, ID generation logic might be handled differently.

module.exports = (context) => {
    const { counters } = context;

    // The actual controller function for POST /api/users
    const createUser = async (req, res) => {
        // 1. Get data from request body
        const { name, phone, email } = req.body;

        // 2. Simple validation
        if (!name || !phone) {
            return res.status(400).json({ 
                error: 'Name and phone are required' 
            });
        }
        
        try {
            // 3. Generate sequential user_id
            counters.user_id += 1; // Increment the global counter
            const newUserId = `U${counters.user_id}`;

            // 4. Create and save the User document using the Mongoose Model
            const newUser = new User({
                user_id: newUserId,
                name: name,
                phone: phone,
                email: email,
                status: "ACTIVE",
            });

            const savedUser = await newUser.save();
            
            // 5. Return success response
            // 📤 Response (Example Flow Output)
            return res.status(201).json({
                user_id: savedUser.user_id,
                message: "User created successfully"
            });

        } catch (error) {
            // Handle duplicate key errors (e.g., phone already exists)
            if (error.code === 11000) {
                return res.status(409).json({
                    error: "User with this phone number or email already exists.",
                    detail: error.message,
                });
            }
            // Handle other server errors
            console.error("Error creating user:", error);
            return res.status(500).json({
                error: "Internal Server Error during user creation.",
            });
        }
    };

    return {
        createUser,
    };
};
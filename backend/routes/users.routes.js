// src/routes/users.routes.js

const express = require('express');

// Function to get the controller with the necessary context (counters)
const userController = require('../controllers/user.controller');

// Export a function that sets up the routes
module.exports = (context) => {
    const router = express.Router();
    
    const controller = userController(context);

    router.post('/users', controller.createUser);

    return router;
};
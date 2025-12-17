// backend/routes/otp.routes.js

const express = require('express');
const router = express.Router();

// Import the controller module (which is a function)
const otpControllerModule = require('../controllers/otp.controller'); 

// EXPORT A FUNCTION that takes context as an argument
module.exports = (context) => {
    
    // INITIALIZE the controller using the context
    const otpController = otpControllerModule(context);

    // Define the routes using the initialized controller methods
    router.post('/otp/request', otpController.requestOtp);
    router.post('/otp/verify', otpController.verifyOtp);

    // RETURN the router instance
    return router;
};
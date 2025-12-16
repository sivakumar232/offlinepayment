const express = require('express');

const bankController = require('../controllers/bank.controller');

module.exports = (context) => {
    const router = express.Router();
    
    // Pass the context (counters) to the controller function
    const controller = bankController(context);


    router.post('/bank/accounts', controller.createBankAccount);

    return router;
};
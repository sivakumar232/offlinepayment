// routes/sync.routes.js

const express = require('express');
const syncController = require('../controllers/sync.controller');

module.exports = (context) => {
    const router = express.Router();
    const controller = syncController(context);

    // CORE ROUTE: Receives and processes offline transactions
    router.post('/sync', controller.processTransactions);

    return router;
};
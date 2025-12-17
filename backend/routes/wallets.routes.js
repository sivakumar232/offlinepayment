// src/routes/wallets.routes.js

const express = require('express');
const walletController = require('../controllers/wallet.controller');

module.exports = (context) => {
    const router = express.Router();
    const controller = walletController(context);

    // 📌 ROUTE 1: POST /api/wallets (Wallet Creation and Linking)
    router.post('/wallets', controller.createWallet);

    // 📌 ROUTE 2: NEW: POST /api/wallets/transaction (Transaction Submission)
    router.post('/wallets/transaction', controller.submitTransaction); 
    // src/routes/wallets.routes.js
// ... inside the module.exports function ...
router.post('/wallets/load-funds', controller.loadFunds); 
// ...
    return router;
};
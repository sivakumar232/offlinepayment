// src/routes/wallets.routes.js

const express = require('express');
const walletController = require('../controllers/wallet.controller');

module.exports = (context) => {
    const router = express.Router();
    const controller = walletController(context);

    // 📌 ROUTE: POST /api/wallets (Wallet Creation and Linking)
    router.post('/wallets', controller.createWallet);

    return router;
};
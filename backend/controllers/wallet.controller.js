// src/controllers/wallet.controller.js

const User = require('../models/User.model');
const BankAccount = require('../models/BankAccount.model');
const Wallet = require('../models/Wallet.model');
const { OFFLINE_LIMIT } = require('../config/constants'); // Assuming constants file

module.exports = (context) => {
    const { counters } = context;

    const createWallet = async (req, res) => {
        const { user_id, account_id, public_key, device_id } = req.body;

        if (!user_id || !account_id || !public_key || !device_id) {
            return res.status(400).json({
                error: 'user_id, account_id, public_key, and device_id are required.'
            });
        }
        
        try {
            const [userExists, accountExists, walletExists] = await Promise.all([
                User.findOne({ user_id }),
                BankAccount.findOne({ account_id }),
                Wallet.findOne({ $or: [{ user_id }, { account_id }, { device_id }] })
            ]);

            if (!userExists) {
                return res.status(404).json({ error: `User ID ${user_id} not found.` });
            }
            if (!accountExists) {
                return res.status(404).json({ error: `Bank Account ID ${account_id} not found.` });
            }
            if (walletExists) {
                return res.status(409).json({ error: 'Wallet, account, or device is already registered.' });
            }

            counters.wallet_id += 1;
            const newWalletId = `WALLET${counters.wallet_id}`;
            
            const newWallet = new Wallet({
                wallet_id: newWalletId,
                user_id,
                account_id,
                public_key,
                device_id,
                offline_limit: 500, // Hardcoded per spec
                current_counter: 0,
                status: 'ACTIVE',
            });

            const savedWallet = await newWallet.save();

            return res.status(201).json({
                wallet_id: savedWallet.wallet_id,
                offline_limit: savedWallet.offline_limit,
                message: "Wallet created and linked successfully."
            });

        } catch (error) {
            if (error.code === 11000) {
                 return res.status(409).json({ error: "Duplicate key violation during wallet creation." });
            }
            console.error("Error creating wallet:", error);
            return res.status(500).json({
                error: "Internal Server Error during wallet creation.",
                detail: error.message
            });
        }
    };

    return { createWallet };
};
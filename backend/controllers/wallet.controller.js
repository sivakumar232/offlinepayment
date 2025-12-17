// src/controllers/wallet.controller.js
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User.model');
const BankAccount = require('../models/BankAccount.model');
const Wallet = require('../models/Wallet.model');
const LedgerTransaction = require('../models/LedgerTransaction');

module.exports = (context) => {
    // 1. Create Wallet
    const createWallet = async (req, res) => {
        const { phone, public_key, device_id } = req.body;
        
        try {
            const user = await User.findOne({ phone });
            if (!user) return res.status(404).json({ error: "User not found." });

            const account = await BankAccount.findOne({ user_id: user.user_id });
            if (!account) return res.status(404).json({ error: "No bank account linked." });

            // Check duplicates
            const walletExists = await Wallet.findOne({ $or: [{ user_id: user.user_id }, { device_id }] });
            if (walletExists) return res.status(409).json({ error: "Wallet already exists." });

            // 🚀 GENERATE RANDOM WALLET ID
            const newWalletId = `WALLET-${uuidv4().substring(0, 8).toUpperCase()}`;

            const newWallet = new Wallet({
                wallet_id: newWalletId,
                user_id: user.user_id,
                account_id: account.account_id,
                public_key,
                device_id,
                balance: 0, 
                offline_limit: 500,
                status: 'ACTIVE',
            });

            const savedWallet = await newWallet.save();

            return res.status(201).json({
                wallet_id: savedWallet.wallet_id,
                message: "Wallet created successfully."
            });

        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    };

    // 2. Load Funds
    const loadFunds = async (req, res) => {
        const { wallet_id, amount } = req.body;
        
        try {
            const wallet = await Wallet.findOne({ wallet_id });
            if (!wallet) return res.status(404).json({ error: "Wallet not found." });

            // Atomic Updates
            await BankAccount.findOneAndUpdate({ account_id: wallet.account_id }, { $inc: { balance: -amount } });
            const updatedWallet = await Wallet.findOneAndUpdate({ wallet_id }, { $inc: { balance: amount } }, { new: true });

            return res.status(200).json({ message: "Funds loaded.", new_balance: updatedWallet.balance });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    };

    // 3. Submit Transaction (Sync)
    const submitTransaction = async (req, res) => {
        const { transactions } = req.body;
        const results = [];

        for (const tx of transactions) {
            try {
                // Deduplicate check
                const exists = await LedgerTransaction.findOne({ tx_id: tx.tx_id });
                if (exists) {
                    results.push({ tx_id: tx.tx_id, status: "ALREADY_SYNCED" });
                    continue;
                }

                await LedgerTransaction.create({ ...tx, status: 'SETTLED' });
                await Wallet.findOneAndUpdate({ wallet_id: tx.from_wallet }, { $inc: { balance: -tx.amount } });
                await Wallet.findOneAndUpdate({ wallet_id: tx.to_wallet }, { $inc: { balance: tx.amount } });

                results.push({ tx_id: tx.tx_id, status: "SETTLED" });
            } catch (err) {
                results.push({ tx_id: tx.tx_id, status: "FAILED", error: err.message });
            }
        }
        return res.json({ results });
    };

    return { createWallet, loadFunds, submitTransaction };
};
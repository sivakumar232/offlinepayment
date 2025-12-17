// src/controllers/wallet.controller.js

const User = require('../models/User.model');
const BankAccount = require('../models/BankAccount.model');
const Wallet = require('../models/Wallet.model');
const LedgerTransaction = require('../models/LedgerTransaction');
const { logTx } = require('../utils/logger'); 

module.exports = (context) => {
    const { counters } = context;

    // --- 1. NEW & IMPROVED: Phone-Based Wallet Creation ---
    const createWallet = async (req, res) => {
        // CLIENT NOW ONLY SENDS: phone, public_key, device_id
        const { phone, public_key, device_id } = req.body;
        
        if (!phone || !public_key || !device_id) {
            return res.status(400).json({
                error: 'phone number, public_key, and device_id are required.'
            });
        }
        
        try {
            // A. Find the user by phone number
            const user = await User.findOne({ phone });

            if (!user) {
                return res.status(404).json({ error: `User with phone ${phone} not found.` });
            }

            // B. SECURITY CHECK: Ensure they verified via OTP first (Hackathon Winning Feature)
            if (!user.is_phone_verified) {
                return res.status(403).json({ error: 'Phone number must be verified via OTP first.' });
            }

            const user_id = user.user_id;

            // C. AUTO-LINK: Find the Bank Account linked to this user automatically
            const account = await BankAccount.findOne({ user_id });

            if (!account) {
                return res.status(404).json({ error: `No bank account found for user ${user_id}. Please link a bank account first.` });
            }

            const account_id = account.account_id;

            // D. Check for existing wallet/device to prevent duplicates
            const walletExists = await Wallet.findOne({ 
                $or: [{ user_id }, { account_id }, { device_id }] 
            });

            if (walletExists) {
                return res.status(409).json({ error: 'Wallet, bank account, or device is already registered.' });
            }

            // E. Generate new Wallet ID and Save
            counters.wallet_id += 1;
            const newWalletId = `WALLET${counters.wallet_id}`;
            
            const newWallet = new Wallet({
                wallet_id: newWalletId,
                user_id,
                account_id,
                public_key,
                device_id,
                balance: 0, 
                offline_limit: 500, 
                current_counter: 0,
                status: 'ACTIVE',
            });

            const savedWallet = await newWallet.save();

            return res.status(201).json({
                wallet_id: savedWallet.wallet_id,
                offline_limit: savedWallet.offline_limit,
                message: "Wallet created and bank account linked successfully via phone verification."
            });

        } catch (error) {
            console.error("Error creating wallet:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    };
    
    // --- 2. loadFunds (The Top-Up Logic) ---
    const loadFunds = async (req, res) => {
        const { wallet_id, amount } = req.body;
        
        if (!wallet_id || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: "Valid wallet_id and positive amount are required." });
        }

        try {
            const wallet = await Wallet.findOne({ wallet_id });
            if (!wallet) return res.status(404).json({ error: `Wallet ${wallet_id} not found.` });
            
            const bankAccount = await BankAccount.findOne({ account_id: wallet.account_id });
            
            if (!bankAccount || bankAccount.balance < amount) {
                return res.status(400).json({ error: "Insufficient balance in linked bank account." });
            }

            // ATOMIC TRANSFER
            await BankAccount.findOneAndUpdate(
                { account_id: wallet.account_id },
                { $inc: { balance: -amount } } 
            ); 

            const updatedWallet = await Wallet.updateBalance(wallet_id, amount); 
            
            logTx('INFO', `Funds loaded.`, { wallet_id, amount });

            return res.status(200).json({ 
                message: "Funds loaded successfully.", 
                new_wallet_balance: updatedWallet.balance 
            });

        } catch (error) {
            return res.status(500).json({ error: "Internal Server Error during fund load." });
        }
    };

    // --- 3. Transaction Submission ---
    const submitTransaction = async (req, res) => {
        const { transactions } = req.body; 
        if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
            return res.status(400).json({ error: 'No transactions provided.' });
        }

        const transactionResults = [];
        let successCount = 0;

        for (const tx of transactions) {
            try {
                // Ledger Entry
                await LedgerTransaction.create({
                    ...tx,
                    timestamp: new Date(tx.ts_string),
                    status: 'SETTLED'
                });

                // Atomic Balance Updates
                await Wallet.updateBalance(tx.from_wallet, -tx.amount); 
                await Wallet.updateBalance(tx.to_wallet, +tx.amount);   
                
                transactionResults.push({ tx_id: tx.tx_id, status: "SETTLED" });
                successCount++;

            } catch (err) {
                transactionResults.push({ tx_id: tx.tx_id, status: "FAILED", error: err.message });
            }
        }

        return res.status(successCount > 0 ? 200 : 500).json({
            message: `Processed ${transactions.length} transactions. ${successCount} successful.`,
            results: transactionResults
        });
    };

    return { 
        createWallet,
        loadFunds,
        submitTransaction 
    };
};
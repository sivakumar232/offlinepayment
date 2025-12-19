const { v4: uuidv4 } = require('uuid');
const User = require('../models/User.model');
const BankAccount = require('../models/BankAccount.model');
const Wallet = require('../models/Wallet.model');
const LedgerTransaction = require('../models/LedgerTransaction');

module.exports = (context) => {
    // Helper to get socket instance
    const getIO = (req) => req.app.get('socketio');

    const createWallet = async (req, res) => {
        // ... (Keep existing createWallet logic exactly as is)
    };

    const loadFunds = async (req, res) => {
        const { wallet_id, amount } = req.body;
        
        try {
            const wallet = await Wallet.findOne({ wallet_id });
            if (!wallet) return res.status(404).json({ error: "Wallet not found." });

            await BankAccount.findOneAndUpdate({ account_id: wallet.account_id }, { $inc: { balance: -amount } });
            const updatedWallet = await Wallet.findOneAndUpdate({ wallet_id }, { $inc: { balance: amount } }, { new: true });

            // 🚀 NOTIFY USER VIA SOCKET
            const io = getIO(req);
            io.to(`user_${wallet.user_id}`).emit('BALANCE_UPDATED', {
                type: 'CREDIT',
                amount: amount,
                new_balance: updatedWallet.balance,
                message: `Successfully loaded $${amount} into your wallet.`
            });

            return res.status(200).json({ message: "Funds loaded.", new_balance: updatedWallet.balance });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    };

    const submitTransaction = async (req, res) => {
        const { transactions } = req.body;
        const results = [];
        const io = getIO(req);

        for (const tx of transactions) {
            try {
                const exists = await LedgerTransaction.findOne({ tx_id: tx.tx_id });
                if (exists) {
                    results.push({ tx_id: tx.tx_id, status: "ALREADY_SYNCED" });
                    continue;
                }

                await LedgerTransaction.create({ ...tx, status: 'SETTLED' });
                const fromWallet = await Wallet.findOneAndUpdate({ wallet_id: tx.from_wallet }, { $inc: { balance: -tx.amount } }, { new: true });
                const toWallet = await Wallet.findOneAndUpdate({ wallet_id: tx.to_wallet }, { $inc: { balance: tx.amount } }, { new: true });

                // 🚀 NOTIFY SENDER (Debit)
                if (fromWallet) {
                    io.to(`user_${fromWallet.user_id}`).emit('TRANSACTION_SYNCED', {
                        tx_id: tx.tx_id,
                        type: 'DEBIT',
                        amount: tx.amount,
                        new_balance: fromWallet.balance
                    });
                }

                // 🚀 NOTIFY RECIPIENT (Credit)
                if (toWallet) {
                    io.to(`user_${toWallet.user_id}`).emit('TRANSACTION_SYNCED', {
                        tx_id: tx.tx_id,
                        type: 'CREDIT',
                        amount: tx.amount,
                        new_balance: toWallet.balance
                    });
                }

                results.push({ tx_id: tx.tx_id, status: "SETTLED" });
            } catch (err) {
                results.push({ tx_id: tx.tx_id, status: "FAILED", error: err.message });
            }
        }
        return res.json({ results });
    };

    return { createWallet, loadFunds, submitTransaction };
};
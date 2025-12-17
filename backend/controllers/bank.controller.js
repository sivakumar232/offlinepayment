// src/controllers/bank.controller.js
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User.model'); 
const BankAccount = require('../models/BankAccount.model'); 

module.exports = (context) => {
    const createBankAccount = async (req, res) => {
        const { user_id, initial_balance } = req.body;

        if (!user_id || initial_balance === undefined || typeof initial_balance !== 'number') {
            return res.status(400).json({
                error: 'user_id and initial_balance are required.'
            });
        }
        
        try {
            // 1. Validate User Exists
            const existingUser = await User.findOne({ user_id: user_id });
            if (!existingUser) {
                return res.status(404).json({ error: "User not found." });
            }

            // 2. Check for Duplicate Account
            const existingAccount = await BankAccount.findOne({ user_id: user_id });
            if (existingAccount) {
                 return res.status(409).json({
                    error: "Bank account already exists for this user.",
                    account_id: existingAccount.account_id
                });
            }

            // 3. Generate Random IDs
            const newAccountId = `ACC-${uuidv4().substring(0, 8).toUpperCase()}`;
            
            // Generate a random 12-digit account number
            const newAccountNumber = Math.floor(100000000000 + Math.random() * 900000000000).toString();

            const newBankAccount = new BankAccount({
                account_id: newAccountId,
                user_id: user_id,
                account_number: newAccountNumber,
                ifsc: "MOCK0001234",
                balance: initial_balance, 
                status: 'ACTIVE',
            });

            const savedAccount = await newBankAccount.save();

            return res.status(201).json({
                account_id: savedAccount.account_id,
                user_id: savedAccount.user_id,
                account_number: savedAccount.account_number,
                balance: savedAccount.balance,
                message: "Bank account created successfully."
            });

        } catch (error) {
            return res.status(500).json({
                error: "Internal Server Error during bank account creation.",
                detail: error.message
            });
        }
    };

    return { createBankAccount };
};
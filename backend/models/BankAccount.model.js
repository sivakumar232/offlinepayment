// src/models/BankAccount.model.js

const mongoose = require('mongoose');

const BankAccountSchema = new mongoose.Schema({
    account_id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    user_id: {
        type: String,
        required: true,
        // In a real system, you'd add an index here
    },
    account_number: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    ifsc: {
        type: String,
        required: true,
        trim: true,
    },
    balance: {
        type: Number,
        required: true,
        default: 0,
        min: 0, // Balance cannot go below zero
    },
    currency: {
        type: String,
        enum: ['INR', 'USD', 'EUR'], // Limit to supported currencies
        default: 'INR',
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'FROZEN'],
        default: 'ACTIVE',
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

const BankAccount = mongoose.model('BankAccount', BankAccountSchema);

module.exports = BankAccount;
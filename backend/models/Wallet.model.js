// src/models/Wallet.model.js

const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
    wallet_id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    user_id: {
        type: String,
        required: true,
    },
    account_id: {
        type: String,
        required: true,
        unique: true, // Crucial: Wallet must link to exactly one bank account
    },
    public_key: {
        type: String,
        required: true, // Signing key for transactions
    },
    device_id: {
        type: String,
        required: true, // Binding to a specific device
        unique: true, // Crucial: One device_id per wallet for security
    },
    offline_limit: {
        type: Number,
        default: 500, // Max amount spendable without immediate sync
        min: 0,
    },
    current_counter: {
        type: Number,
        default: 0, // Last accepted transaction sequence number
        min: 0,
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'BLOCKED'],
        default: 'ACTIVE',
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

const Wallet = mongoose.model('Wallet', WalletSchema);

module.exports = Wallet;
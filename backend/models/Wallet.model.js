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
        unique: true,
    },
    public_key: {
        type: String,
        required: true,
    },
    device_id: {
        type: String,
        required: true,
        unique: true,
    },
    
    // CRITICAL: FIELD TO HOLD THE ACCOUNT BALANCE
    balance: { 
        type: Number,
        default: 0,
        min: 0, 
    },
    
    offline_limit: {
        type: Number,
        default: 500,
        min: 0,
    },
    current_counter: {
        type: Number,
        default: 0,
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

// CRITICAL FIX: ATOMIC BALANCE UPDATE METHOD
WalletSchema.statics.updateBalance = async function (walletId, amountChange) {
    if (amountChange === 0) {
        return; 
    }

    // Use $inc for atomic update. This is vital for concurrency control.
    // 
    const updateResult = await this.findOneAndUpdate(
        { wallet_id: walletId },
        { 
            $inc: { balance: amountChange } 
        },
        { 
            new: true // Return the updated document
        }
    );

    if (!updateResult) {
        throw new Error(`Wallet not found for ID: ${walletId}. Balance update failed.`);
    }
    
    return updateResult;
};

const Wallet = mongoose.model('Wallet', WalletSchema);

module.exports = Wallet;
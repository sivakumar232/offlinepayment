// models/LedgerTransaction.js

const mongoose = require('mongoose');

const LedgerTransactionSchema = new mongoose.Schema({
    tx_id: {
        type: String,
        required: true,
        unique: true, // 8. Idempotency Check (FIRST CHECK) relies on this being unique
        trim: true,
    },
    from_wallet: {
        type: String,
        required: true,
    },
    to_wallet: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 1,
    },
    currency: {
        type: String,
        default: 'INR',
    },
    counter: {
        type: Number,
        required: true, // 11. Hash & Hash-Chain Validation relies on this sequence
        min: 1,
    },
    timestamp: {
        type: Number, // UNIX timestamp when TX was created offline
        required: true,
    },
    prev_hash: {
        type: String,
        required: true, // 11. Hash & Hash-Chain Validation relies on this
        trim: true,
    },
    tx_hash: {
        type: String,
        required: true,
        trim: true,
    },
    signature: {
        type: String,
        required: true, // 10. Signature Verification relies on this
        trim: true,
    },
    status: {
        type: String,
        enum: ['PENDING_SETTLEMENT', 'SETTLED', 'BOUNCED'], // Core states
        default: 'PENDING_SETTLEMENT', // All new TXs start here
    },
}, {
    // 4. Enforce Ledger Rules: append-only (no Mongoose update/delete methods are exposed)
    timestamps: { createdAt: 'created_at', updatedAt: false } 
});

// IMPORTANT INDEX: Ensures a wallet cannot reuse a counter value (Replay prevention)
LedgerTransactionSchema.index({ from_wallet: 1, counter: 1 }, { unique: true });

const LedgerTransaction = mongoose.model('LedgerTransaction', LedgerTransactionSchema);

module.exports = LedgerTransaction;
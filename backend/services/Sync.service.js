// services/Sync.service.js

const LedgerTransaction = require('../models/LedgerTransaction.js');
const Wallet = require('../models/Wallet.model');
const DeviceRegistry = require('../models/DeviceRegistry.model');
// Assuming you have a BankAccount model for the true central balance (omitted for brevity)
// const BankAccount = require('../models/BankAccount.model'); 
const { OFFLINE_LIMIT } = require('../config/constants'); 
const { createHash, verifySignature, calculateTransactionHash } = require('../utils/crypto'); 
const { logTx } = require('../utils/logger');



const getLastRecordedTx = async (walletId) => {
    // Find the latest transaction by the wallet that initiated it (DEBIT entries).
    const lastTx = await LedgerTransaction.findOne({ from_wallet: walletId })
        .sort({ counter: -1 })
        .limit(1);
    return lastTx;
};


module.exports = (context) => {
    
    const validateAndInsert = async (tx) => {
        
        // 1. Basic Structure Check
        // ... (Your checks here)

        // --- 8. Idempotency Check (FIRST CHECK: Prevent double processing) ---
        const existingLedgerEntry = await LedgerTransaction.findOne({ tx_id: tx.tx_id });
        if (existingLedgerEntry) {
            logTx('warn', `Idempotency violation for ${tx.tx_id}`, existingLedgerEntry.status);
            return { status: existingLedgerEntry.status, message: `Transaction already processed.` };
        }

        // --- 9. Wallet & Device Validation (Root of Trust Check) ---
        const senderWallet = await Wallet.findOne({ wallet_id: tx.from_wallet });
        const receiverWallet = await Wallet.findOne({ wallet_id: tx.to_wallet }); // NEW: Check receiver wallet exists
        
        const senderDevice = await DeviceRegistry.findOne({ 
            device_id: tx.device_id,
            wallet_id: tx.from_wallet, 
            status: 'ACTIVE' 
        });

        if (!senderWallet || !receiverWallet) {
            throw new Error('Sender or Receiver Wallet not found.');
        }
        if (senderWallet.status !== 'ACTIVE') {
            throw new Error(`Sender Wallet ${tx.from_wallet} is not active.`);
        }
        if (!senderDevice) {
            throw new Error(`No active, registered device found for wallet ${tx.from_wallet}.`);
        }
        
        // ARCHITECTURAL FIX: Use public key from the device, not the wallet document
        const publicKey = senderDevice.public_key; 
        
        // --- 12. Offline Limit Check ---
        if (tx.amount > senderWallet.offline_limit || tx.amount > OFFLINE_LIMIT) { 
            throw new Error(`Amount exceeds maximum offline limit.`);
        }
        
        // --- 10. Hash & Signature Verification ---
        // 10a. Check payload integrity
        const calculatedHash = calculateTransactionHash(tx); 
        if (calculatedHash !== tx.tx_hash) {
            throw new Error(`Hash mismatch: Data corruption detected for ${tx.tx_id}.`);
        }
        // 10b. Verify authenticity
        const isSignatureValid = verifySignature(tx.tx_hash, tx.signature, publicKey); 
        if (!isSignatureValid) {
            throw new Error('Signature verification failed: Not signed by authorized key.');
        }
        
        // --- 11. Hash & Hash-Chain Validation (Sequence Integrity) ---
        const lastTx = await getLastRecordedTx(tx.from_wallet);
        
        const expectedCounter = (lastTx ? lastTx.counter : 0) + 1;
        const expectedPrevHash = (lastTx ? lastTx.tx_hash : createHash('INITIAL_LEDGER_SEED')); 

        if (tx.counter !== expectedCounter) {
            throw new Error(`Counter mismatch. Expected ${expectedCounter}, got ${tx.counter}. Sequence broken.`);
        }
        if (tx.prev_hash !== expectedPrevHash) {
             throw new Error('Hash chain broken. Previous hash does not match last ledger entry.');
        }

        // --- 13. Insert Into Ledger (Record) ---
        
        const newLedgerEntry = new LedgerTransaction({
            // ... (Your ledger fields)
            tx_id: tx.tx_id,
            from_wallet: tx.from_wallet,
            to_wallet: tx.to_wallet,
            amount: tx.amount,
            currency: tx.currency || 'INR', 
            counter: tx.counter,
            timestamp: tx.timestamp,
            prev_hash: tx.prev_hash,
            tx_hash: tx.tx_hash,
            signature: tx.signature,
            status: 'PENDING_SETTLEMENT', 
        });

        await newLedgerEntry.save();
        logTx('success', `TX ${tx.tx_id} inserted into Ledger`, 'PENDING_SETTLEMENT');

        // --- 14. Insufficient Balance Check (Central Check) ---
        // NOTE: This MUST happen after ledger insertion in case another transaction 
        // settles between the check and the update. We rely on MongoDB's atomic update 
        // to handle concurrency for the final balance change.

        if (senderWallet.balance < tx.amount) {
            // Log this as a failure, but the ledger entry is still there (marked as PENDING)
            // A separate job could change status to REJECTED/FAILED.
            logTx('error', `Central balance check failed for ${tx.tx_id}`, 'INSUFFICIENT_BALANCE');
            throw new Error(`Insufficient central balance for settlement.`); 
        }

        // --- 15. SETTLEMENT: Atomic Balance Update & Status Change ---
        
        // Debit Sender Wallet
        const debitResult = await Wallet.updateOne(
            { wallet_id: tx.from_wallet, balance: { $gte: tx.amount } }, // Optimistic Lock/Concurrency Check
            { $inc: { balance: -tx.amount }, $set: { current_counter: tx.counter } } // Update balance & counter
        );

        // Credit Receiver Wallet
        await Wallet.updateOne(
            { wallet_id: tx.to_wallet },
            { $inc: { balance: tx.amount } }
        );

        // Update Ledger Status to SETTLED
        await LedgerTransaction.updateOne(
            { tx_id: tx.tx_id },
            { $set: { status: 'SETTLED' } }
        );

        // Final Logging
        logTx('success', `TX ${tx.tx_id} successfully settled and balance updated.`, 'SETTLED');
        
        return { 
            status: 'SETTLED', 
            message: 'Transaction accepted, recorded, and settled successfully.' 
        };
    };

    return { validateAndInsert };
};
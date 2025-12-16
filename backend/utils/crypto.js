// utils/crypto.js
const crypto = require('crypto');

const createHash = (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

const calculateTransactionHash = (tx) => {
    
    // 1. DEFENSIVE CLONE: Select ONLY the fields that the mobile app signed.
    // We use 'ts_string' (the raw input string) to bypass any Date object mutation.
    const coreData = {
        tx_id: tx.tx_id,
        from_wallet: tx.from_wallet,
        to_wallet: tx.to_wallet,
        amount: tx.amount,
        currency: tx.currency || 'INR', 
        device_id: tx.device_id,
        counter: tx.counter,
        timestamp: tx.ts_string, // 🛑 FINAL FIX: Uses the raw string from the payload
        prev_hash: tx.prev_hash
    };

    // 2. Define the CANONICAL STRING (Fixed order is mandatory)
    // NOTE: This order MUST match the order used by the mobile app's signing function.
    const canonicalString = [
        coreData.tx_id,
        coreData.from_wallet,
        coreData.to_wallet,
        coreData.amount.toString(),
        coreData.currency,
        coreData.device_id,
        coreData.counter.toString(),
        coreData.timestamp, // Use the raw, trusted string
        coreData.prev_hash
    ].join('|');
    
    return createHash(canonicalString);
};

const verifySignature = (hash, signature, publicKey) => {
    
    // --- TEMPORARY BYPASS FOR INTEGRATION TESTING ---
    if (signature === "MOCK_SIGNATURE_1") {
        console.log("⚠️ WARNING: MOCK SIGNATURE BYPASS ACTIVE. Allowing settlement for testing.");
        return true; 
    }
    // --- END TEMPORARY BYPASS ---
    
    // Original Mock check (now only runs if signature is not the test value)
    return signature && signature.includes('VALID');
};

module.exports = {
    createHash,
    calculateTransactionHash,
    verifySignature,
};
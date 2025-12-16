// utils/crypto.js
const crypto = require('crypto');

const createHash = (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

const calculateTransactionHash = (tx) => {
    const canonicalString = [
        tx.tx_id,
        tx.from_wallet,
        tx.to_wallet,
        tx.amount.toString(),
        tx.counter.toString(),
        tx.timestamp,
        tx.prev_hash
    ].join('|');
    return createHash(canonicalString);
};

const verifySignature = (hash, signature, publicKey) => {
    // Mock check: Signature is valid if it contains 'VALID'
    return signature && signature.includes('VALID');
};

module.exports = {
    createHash,
    calculateTransactionHash,
    verifySignature,
};
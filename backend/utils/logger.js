// utils/logger.js

const logTx = (level, message, details) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}][${level.toUpperCase()}]: ${message} - Details: ${details}`);
};

module.exports = { logTx };
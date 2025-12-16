// controllers/sync.controller.js

const SyncService = require('../services/Sync.service');
const { logTx } = require('../utils/logger'); // Needs utils/logger.js

module.exports = (context) => {
    const syncService = SyncService(context);

    const processTransactions = async (req, res) => {
        const transactions = req.body.transactions;

        if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
            return res.status(400).json({ error: 'Request body must contain an array of transactions.' });
        }
        
        const results = [];

        for (const tx of transactions) {
            try {
                // This call executes the 10-step validation
                const result = await syncService.validateAndInsert(tx);
                results.push({ tx_id: tx.tx_id, status: result.status, message: result.message });

            } catch (error) {
                // Catches validation errors and returns REJECTED status
                results.push({ 
                    tx_id: tx.tx_id || 'UNKNOWN', 
                    status: 'REJECTED', 
                    message: error.message 
                });
            }
        }

        return res.status(200).json({
            message: `Processed ${transactions.length} transactions.`,
            results,
        });
    };

    return { processTransactions };
};
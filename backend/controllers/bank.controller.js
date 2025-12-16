// controllers/bank.controller.js

const User = require('../models/User.model'); 
const BankAccount = require('../models/BankAccount.model'); 

// Note: Ensure your server.js passes the 'counters' object in the context
module.exports = (context) => {
    // Destructure counters from the context object for use in this controller
    const { counters } = context; 

    const createBankAccount = async (req, res) => {
        // 1. Get data from request body (user_id and initial_balance)
        const { user_id, initial_balance } = req.body;

        if (!user_id || initial_balance === undefined || typeof initial_balance !== 'number' || initial_balance < 0) {
            return res.status(400).json({
                error: 'Invalid request: user_id and a valid initial_balance (non-negative number) are required.'
            });
        }
        
        try {
            // 2. Validate User Existence
            const existingUser = await User.findOne({ user_id: user_id });
            
            if (!existingUser) {
                return res.status(404).json({
                    error: `User not found: Cannot create bank account for unknown user_id ${user_id}.`
                });
            }

            // 3. Prevent Duplicate Account
            const existingAccount = await BankAccount.findOne({ user_id: user_id });
            if (existingAccount) {
                 return res.status(409).json({
                    error: `Bank account already exists for user_id ${user_id}.`,
                    account_id: existingAccount.account_id
                });
            }

            // 4. Generate Unique IDs and Mock Data
            
            // Atomically increment the counter and format the account_id
            counters.account_id += 1;
            const newAccountId = `ACC${counters.account_id.toString().padStart(4, '0')}`;

            // Generate Mock Account Number and IFSC
            // Ensures a unique 12-digit mock number tied to the counter for easy tracing
            const newAccountNumber = `9000${counters.account_id.toString().padStart(8, '0')}`; 
            const mockIfsc = "MOCK0001234";

            // 5. Create and save the BankAccount document
            const newBankAccount = new BankAccount({
                account_id: newAccountId,
                user_id: user_id,
                account_number: newAccountNumber,
                ifsc: mockIfsc,
                balance: initial_balance, 
                currency: 'INR',
                status: 'ACTIVE',
            });

            const savedAccount = await newBankAccount.save();

            // 6. Return success response with generated fields
            return res.status(201).json({
                account_id: savedAccount.account_id,
                user_id: savedAccount.user_id,
                account_number: savedAccount.account_number, // Added for clarity
                balance: savedAccount.balance,
                message: "Bank account created and initialized successfully."
            });

        } catch (error) {
            console.error("Error creating bank account:", error);
            // Handle any unexpected database or server errors
            return res.status(500).json({
                error: "Internal Server Error during bank account creation.",
                 detail: error.message
            });
        }
    };

    return {
        createBankAccount,
    };
};
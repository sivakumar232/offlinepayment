const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const connectDB = require('./config/db');

// Import Models so we can check the last ID
const User = require('./models/User.model');
const BankAccount = require('./models/BankAccount.model');
const Wallet = require('./models/Wallet.model');

// Import Routes
const userRoutes = require('./routes/users.routes');
const bankRoutes = require('./routes/bank.routes');
const walletRoutes = require('./routes/wallets.routes');
const deviceRoutes = require('./routes/devices.routes');
const syncRoutes = require('./routes/sync.routes');
const otpRoutes = require('./routes/otp.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// --- THE FIX: DYNAMIC INITIALIZATION ---
const initializeCounters = async () => {
    console.log('🔄 Checking Database for last used IDs...');

    // 1. Find last User ID (e.g., U1005)
    const lastUser = await User.findOne().sort({ createdAt: -1 });
    // If U1005 exists, start at 1005. If null, start at 1000.
    const userCount = lastUser ? parseInt(lastUser.user_id.replace('U', '')) : 1000;

    // 2. Find last Account ID (e.g., ACC9005)
    const lastAccount = await BankAccount.findOne().sort({ createdAt: -1 });
    const accountCount = lastAccount ? parseInt(lastAccount.account_id.replace('ACC', '')) : 9000;

    // 3. Find last Wallet ID (e.g., WALLET105)
    const lastWallet = await Wallet.findOne().sort({ createdAt: -1 });
    const walletCount = lastWallet ? parseInt(lastWallet.wallet_id.replace('WALLET', '')) : 100;

    console.log(`✅ Counters Initialized: User=${userCount}, Account=${accountCount}, Wallet=${walletCount}`);
    
    return {
        user_id: userCount,
        account_id: accountCount,
        wallet_id: walletCount
    };
};

const startServer = async () => {
    try {
        await connectDB();

        // Initialize counters dynamically BEFORE starting routes
        const dynamicCounters = await initializeCounters();

        const context = {
            counters: dynamicCounters,
        };

        app.get('/', (req, res) => {
            res.send(`Server Running. Next User ID will be: U${context.counters.user_id + 1}`);
        });

        app.use('/api', userRoutes(context));
        app.use('/api', bankRoutes(context));
        app.use('/api', walletRoutes(context));
        app.use('/api', deviceRoutes(context));
        app.use('/api', syncRoutes(context));
        app.use('/api', otpRoutes(context));

        app.listen(PORT, () => {
            console.log(`✅ Server listening on port ${PORT}`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
    }
};

startServer();
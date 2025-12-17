// src/server.js
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const connectDB = require('./config/db');

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

const startServer = async () => {
    try {
        // 1. Connect to MongoDB
        await connectDB();

        // 2. Context
        // We no longer need 'counters', but we keep the object 
        // in case you want to pass other global variables later.
        const context = {}; 

        // 3. Health Check
        app.get('/', (req, res) => {
            res.status(200).send('✅ Server Running. IDs are now using Random UUIDs (Safe Mode).');
        });

        // 4. Register Routes
        app.use('/api', userRoutes(context));
        app.use('/api', bankRoutes(context));
        app.use('/api', walletRoutes(context));
        app.use('/api', deviceRoutes(context));
        app.use('/api', syncRoutes(context));
        app.use('/api', otpRoutes(context));

        // 5. Start Listener
        app.listen(PORT, () => {
            console.log(`✅ Server listening on port ${PORT}`);
            console.log(`📡 Local Host: http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();

    const express = require('express');
    const bodyParser = require('body-parser');
    require('dotenv').config(); // Load environment variables from .env
    const connectDB = require('./config/db'); 

    const userRoutes = require('./routes/users.routes');
    const bankRoutes = require('./routes/bank.routes'); 
    const walletRoutes = require('./routes/wallets.routes'); 
    const deviceRoutes = require('./routes/devices.routes'); 
    const syncRoutes = require('./routes/sync.routes');
    const otpRoutes = require('./routes/otp.routes');
    let globalCounters = {
        user_id: 1000,   // U1001, U1002, ...
        account_id: 9000, // ACC9001, ACC9002, ...
        wallet_id: 100,  // WALLET101, WALLET102, ...
    };

    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(bodyParser.json());

    const startServer = async () => {
        await connectDB();

        const context = {
            counters: globalCounters,
        };

        app.get('/', (req, res) => {
            res.send('Stage 0 Backend Running & MongoDB Connected. Ready for setup APIs.');
        });

        
        app.use('/api', userRoutes(context));
        app.use('/api', bankRoutes(context)); 
        app.use('/api', walletRoutes(context)); 
        app.use('/api', deviceRoutes(context));
        app.use('/api', syncRoutes(context));
        app.use('/api', otpRoutes(context));
        // 3. Start Listening
        app.listen(PORT, () => {
            console.log(`✅ Stage 0 Server listening on port ${PORT}`);
            console.log(`Local Host: http://localhost:${PORT}`);
            console.log('---');
            console.log(`Endpoints available: POST /api/users, POST /api/bank/accounts`);
        });
    };

    startServer();
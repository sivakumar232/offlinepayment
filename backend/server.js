const express = require('express');
const bodyParser = require('body-parser');
const http = require('http'); // 1. Import http
const { Server } = require('socket.io'); // 2. Import Socket.io
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
const server = http.createServer(app); // 3. Create HTTP server
const io = new Server(server, {
    cors: { origin: "*" } // Enable for mobile/web clients
});

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// 4. Attach Socket.io to app to make it accessible in controllers
app.set('socketio', io);

// 5. Handle Socket Connections
io.on('connection', (socket) => {
    const { userId } = socket.handshake.query;
    if (userId) {
        socket.join(`user_${userId}`); // Join a private room for this user
        console.log(`📡 User connected to socket: user_${userId}`);
    }

    socket.on('disconnect', () => {
        console.log('❌ User disconnected from socket');
    });
});

const startServer = async () => {
    try {
        await connectDB();
        const context = {}; 

        app.get('/', (req, res) => {
            res.status(200).send('✅ Server Running with WebSockets.');
        });

        app.use('/api', userRoutes(context));
        app.use('/api', bankRoutes(context));
        app.use('/api', walletRoutes(context));
        app.use('/api', deviceRoutes(context));
        app.use('/api', syncRoutes(context));
        app.use('/api', otpRoutes(context));

        // 6. Listen using 'server', not 'app'
        server.listen(PORT, () => {
            console.log(`✅ Server listening on port ${PORT}`);
            console.log(`📡 WebSocket enabled`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
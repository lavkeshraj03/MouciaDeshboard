const jwt = require('jsonwebtoken');
const User = require('../models/User');

let ioInstance;
const disconnectTimeouts = new Map();

module.exports = {
    initSocket: (server) => {
        const { Server } = require('socket.io');
        ioInstance = new Server(server, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:3000',
                methods: ['GET', 'POST']
            }
        });

        // 1. Socket Authentication Middleware
        ioInstance.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) return next(new Error('Authentication error: No token provided'));

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.userId).select('-password');

                if (!user) return next(new Error('Authentication error: User not found'));

                socket.user = user;
                next();
            } catch (err) {
                console.error('Socket Auth Error:', err.message);
                return next(new Error('Authentication error: Invalid Token'));
            }
        });

        // 2. Connection Handlers
        ioInstance.on('connection', async (socket) => {
            console.log(`Secured Socket Connected: ${socket.user.name} (${socket.id})`);

            const userIdStr = socket.user._id.toString();

            // Clear any pending disconnect timeouts
            if (disconnectTimeouts.has(userIdStr)) {
                clearTimeout(disconnectTimeouts.get(userIdStr));
                disconnectTimeouts.delete(userIdStr);
                console.log(`[Socket] Cleared disconnect timeout for ${userIdStr} (Reconnected in time)`);
            }

            // Mark User Online immediately upon socket connection (if they reconnect, we must restore their status)
            try {
                const Session = require('../models/Session');
                // Check if they have an active or paused session that implies they are working
                const activeSession = await Session.findOne({ userId: socket.user._id, status: { $in: ['Active', 'Paused'] } });

                // For simplicity: if they connect to the dashboard, consider them 'Online' presence wise.
                await User.findByIdAndUpdate(socket.user._id, {
                    isOnline: true,
                    lastActive: new Date()
                });

                ioInstance.emit('employeeStatusUpdated', {
                    userId: socket.user._id.toString(),
                    isOnline: true,
                    lastActive: new Date()
                });
            } catch (err) {
                console.error('Connection Update Error:', err);
            }

            socket.on('disconnect', async () => {
                console.log(`Socket Disconnected: ${socket.user.name} (${socket.id})`);

                // Set grace period of 5 minutes (300,000 ms) before forcing session end
                const timeoutId = setTimeout(async () => {
                    console.log(`[Socket] 5-minute grace period expired for ${userIdStr}. Forcing session end...`);
                    const { forceEndAbruptSession } = require('../controllers/sessionController');
                    await forceEndAbruptSession(userIdStr);
                    disconnectTimeouts.delete(userIdStr);

                    try {
                        ioInstance.emit('employeeStatusUpdated', {
                            userId: userIdStr,
                            isOnline: false,
                            lastActive: new Date()
                        });
                    } catch (e) {
                        console.error(e);
                    }
                }, 5 * 60 * 1000);

                disconnectTimeouts.set(userIdStr, timeoutId);

                // Mark Offline on abrupt disconnect
                try {
                    await User.findByIdAndUpdate(socket.user._id, {
                        isOnline: false,
                        lastActive: new Date()
                    });

                    ioInstance.emit('employeeStatusUpdated', {
                        userId: socket.user._id.toString(),
                        isOnline: false,
                        lastActive: new Date()
                    });
                } catch (err) {
                    console.error('Disconnect Update Error:', err);
                }
            });
        });

        return ioInstance;
    },
    getIO: () => {
        if (!ioInstance) {
            throw new Error('Socket.io not initialized!');
        }
        return ioInstance;
    }
};

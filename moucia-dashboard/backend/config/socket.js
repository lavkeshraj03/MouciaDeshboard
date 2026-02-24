const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

let ioInstance;
const disconnectTimeouts = new Map();
const userLastPingState = new Map(); // { userId: { lastPingAt: number, state: 'Active' | 'Idle' | 'Away', sessionId: string } }

module.exports = {
    initSocket: (server) => {
        const { Server } = require('socket.io');
        ioInstance = new Server(server, {
            cors: {
                origin: [
                    "http://localhost:3000",
                    "https://moucia-deshboard-w3zt.vercel.app",
                    "https://moucia-deshboard.vercel.app",
                    "https://mouciadeshboard.vercel.app"
                ],
                methods: ['GET', 'POST'],
                credentials: true
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
                // Check if they have an active or paused session that implies they are working
                const activeSession = await Session.findOne({ userId: socket.user._id, status: { $in: ['Active', 'Paused'] } });

                // Initialize ping tracker for this connection if active session is going on
                if (activeSession) {
                    userLastPingState.set(userIdStr, {
                        lastPingAt: Date.now(),
                        state: 'Active',
                        sessionId: activeSession._id.toString()
                    });
                }

                // For simplicity: if they connect to the dashboard, consider them 'Online' presence wise.
                await User.findByIdAndUpdate(socket.user._id, {
                    isOnline: true,
                    lastActive: new Date()
                });

                const updatedUser = await User.findById(socket.user._id);

                ioInstance.emit('employeeStatusUpdated', {
                    userId: socket.user._id.toString(),
                    isOnline: !!activeSession,
                    statusState: activeSession ? 'Active' : 'Offline',
                    lastActive: new Date(),
                    todayWorkedSeconds: updatedUser.todayWorkedSeconds,
                    todayActiveSeconds: updatedUser.todayActiveSeconds || 0,
                    todayIdleSeconds: updatedUser.todayIdleSeconds || 0,
                    todayAwaySeconds: updatedUser.todayAwaySeconds || 0,
                    sessionStartTime: activeSession ? activeSession.startTime : null
                });
            } catch (err) {
                console.error('Connection Update Error:', err);
            }

            // Listen for Pings from the Productivity Tracker Hook
            socket.on('userActivityPing', async (data) => {
                try {
                    const { state } = data; // 'Active', 'Idle', 'Away'
                    const now = Date.now();

                    if (userLastPingState.has(userIdStr)) {
                        const trackData = userLastPingState.get(userIdStr);
                        const elapsedMs = now - trackData.lastPingAt;
                        const elapsedSecs = Math.floor(elapsedMs / 1000);

                        if (elapsedSecs > 0 && elapsedSecs < 120) { // Safety cap per ping (max 2 mins missing)

                            // Map state to db fields
                            let userInc = {};
                            let sessionInc = {};

                            if (trackData.state === 'Active') {
                                userInc.todayActiveSeconds = elapsedSecs;
                                sessionInc.activeSeconds = elapsedSecs;
                            } else if (trackData.state === 'Idle') {
                                userInc.todayIdleSeconds = elapsedSecs;
                                sessionInc.idleSeconds = elapsedSecs;
                            } else if (trackData.state === 'Away') {
                                userInc.todayAwaySeconds = elapsedSecs;
                                sessionInc.awaySeconds = elapsedSecs;
                            }

                            // Update DB
                            const [updatedUser, updatedSession] = await Promise.all([
                                User.findByIdAndUpdate(userIdStr, { $inc: userInc }, { new: true }),
                                Session.findByIdAndUpdate(trackData.sessionId, { $inc: sessionInc }, { new: true })
                            ]);

                            // Calculate Session Productivity Score Live
                            if (updatedSession) {
                                const totalTracked = updatedSession.activeSeconds + updatedSession.idleSeconds + updatedSession.awaySeconds;
                                let prodScore = 100;
                                if (totalTracked > 0) {
                                    prodScore = Math.round((updatedSession.activeSeconds / totalTracked) * 100);
                                }
                                await Session.findByIdAndUpdate(updatedSession._id, { productivityScore: prodScore });
                            }

                            // Broadcast the LIVE enrich matrix back down immediately to Admins
                            ioInstance.emit('employeeStatusUpdated', {
                                userId: userIdStr,
                                isOnline: true,
                                statusState: state, // They just reported this
                                lastActive: new Date(),
                                todayWorkedSeconds: updatedUser.todayWorkedSeconds,
                                todayActiveSeconds: updatedUser.todayActiveSeconds,
                                todayIdleSeconds: updatedUser.todayIdleSeconds,
                                todayAwaySeconds: updatedUser.todayAwaySeconds,
                                sessionStartTime: updatedSession ? updatedSession.startTime : null
                            });
                        }
                    } else {
                        // Check if they have an active session to pick up tracking mid-way
                        const activeSession = await Session.findOne({ userId: userIdStr, status: 'Active' });
                        if (activeSession) {
                            userLastPingState.set(userIdStr, {
                                lastPingAt: now,
                                state: state,
                                sessionId: activeSession._id.toString()
                            });
                        }
                    }

                    // Always Overwrite internal memory tracker to the *new* state pinged for the next interval
                    if (userLastPingState.has(userIdStr)) {
                        const existing = userLastPingState.get(userIdStr);
                        userLastPingState.set(userIdStr, {
                            ...existing,
                            lastPingAt: now,
                            state: state
                        });
                    }

                } catch (e) {
                    console.error('Activity Ping Error:', e);
                }
            });

            socket.on('disconnect', async () => {
                console.log(`Socket Disconnected: ${socket.user.name} (${socket.id})`);

                // Set grace period of 5 minutes (300,000 ms) before forcing session end
                const timeoutId = setTimeout(async () => {
                    console.log(`[Socket] 5-minute grace period expired for ${userIdStr}. Forcing session end...`);
                    const { forceEndAbruptSession } = require('../controllers/sessionController');
                    await forceEndAbruptSession(userIdStr);
                    disconnectTimeouts.delete(userIdStr);

                    try {
                        const updatedUser = await User.findById(userIdStr);
                        ioInstance.emit('employeeStatusUpdated', {
                            userId: userIdStr,
                            isOnline: false,
                            statusState: 'Offline',
                            lastActive: new Date(),
                            todayWorkedSeconds: updatedUser ? updatedUser.todayWorkedSeconds : 0,
                            todayActiveSeconds: updatedUser ? updatedUser.todayActiveSeconds : 0,
                            todayIdleSeconds: updatedUser ? updatedUser.todayIdleSeconds : 0,
                            todayAwaySeconds: updatedUser ? updatedUser.todayAwaySeconds : 0,
                            sessionStartTime: null
                        });
                        userLastPingState.delete(userIdStr);
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

                    const disconnectedUser = await User.findById(socket.user._id);
                    ioInstance.emit('employeeStatusUpdated', {
                        userId: socket.user._id.toString(),
                        isOnline: false,
                        statusState: 'Offline',
                        lastActive: new Date(),
                        todayWorkedSeconds: disconnectedUser ? disconnectedUser.todayWorkedSeconds : 0,
                        todayActiveSeconds: disconnectedUser ? disconnectedUser.todayActiveSeconds : 0,
                        todayIdleSeconds: disconnectedUser ? disconnectedUser.todayIdleSeconds : 0,
                        todayAwaySeconds: disconnectedUser ? disconnectedUser.todayAwaySeconds : 0,
                        sessionStartTime: null
                    });
                    // Temporarily remove ping state
                    userLastPingState.delete(socket.user._id.toString());
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

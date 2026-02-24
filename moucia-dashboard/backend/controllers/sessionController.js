const Session = require('../models/Session');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Settings = require('../models/Settings');

exports.startSession = async (req, res) => {
    try {
        const userId = req.user._id;

        // Check if there is already an active or paused session today (or close it)
        // Simplify: just create a new active session
        let session = await Session.findOne({ userId, status: { $in: ['Active', 'Paused'] } });

        if (session) {
            if (session.status === 'Paused') {
                session.status = 'Active';
                session.startTime = Date.now(); // update start time to now to continue counting duration later
                await session.save();

                // Mark isOnline and Emit on RESUME
                const resumedUser = await User.findByIdAndUpdate(userId, { isOnline: true, lastActive: new Date() }, { new: true });
                const { getIO } = require('../config/socket');
                try {
                    const io = getIO();
                    if (io) {
                        io.emit('employeeStatusUpdated', {
                            userId: resumedUser._id.toString(),
                            isOnline: true,
                            lastActive: resumedUser.lastActive,
                            todayWorkedSeconds: resumedUser.todayWorkedSeconds,
                            sessionStartTime: session.startTime
                        });
                    }
                } catch (err) {
                    console.error('Socket emit error:', err);
                }

                return res.status(200).json({ message: 'Session resumed', session });
            }
            return res.status(400).json({ message: 'Session already active' });
        }

        session = await Session.create({
            userId,
            startTime: Date.now(),
            status: 'Active'
        });

        // 1. Mark isOnline and Emit
        const user = Object.assign(await User.findByIdAndUpdate(userId, { isOnline: true, lastActive: new Date() }, { new: true }));
        const { getIO } = require('../config/socket');
        try {
            const io = getIO();
            if (io) {
                io.emit('employeeStatusUpdated', {
                    userId: user._id.toString(),
                    isOnline: true,
                    statusState: 'Active',
                    lastActive: user.lastActive,
                    todayWorkedSeconds: user.todayWorkedSeconds,
                    todayActiveSeconds: user.todayActiveSeconds || 0,
                    todayIdleSeconds: user.todayIdleSeconds || 0,
                    todayAwaySeconds: user.todayAwaySeconds || 0,
                    sessionStartTime: session.startTime
                });
                console.log(`[Socket] Emitted employeeStatusUpdated for User: ${user._id} (Online)`);
            }
        } catch (err) {
            console.error('Socket emit error:', err);
        }

        res.status(201).json({ message: 'Session started', session });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

exports.pauseSession = async (req, res) => {
    try {
        const userId = req.user._id;
        const session = await Session.findOne({ userId, status: 'Active' });

        if (!session) {
            return res.status(400).json({ message: 'No active session found' });
        }

        const now = Date.now();
        const durationSinceStart = Math.floor((now - session.startTime.getTime()) / 1000);

        let settings = await Settings.findOne();
        if (!settings) settings = { targetHours: 8, minimumSessionBuffer: 120 };
        const minSessionSeconds = settings.minimumSessionBuffer * 60;
        const targetSeconds = settings.targetHours * 3600;

        session.duration += durationSinceStart;
        const user = await User.findById(userId);
        const newTotalWorked = user.todayWorkedSeconds + durationSinceStart;

        const { getIO } = require('../config/socket');
        const emitOffline = () => {
            try {
                getIO().emit('employeeStatusUpdated', {
                    userId: user._id.toString(),
                    isOnline: false,
                    statusState: 'Offline',
                    lastActive: user.lastActive,
                    todayWorkedSeconds: user.todayWorkedSeconds,
                    todayActiveSeconds: user.todayActiveSeconds || 0,
                    todayIdleSeconds: user.todayIdleSeconds || 0,
                    todayAwaySeconds: user.todayAwaySeconds || 0,
                    sessionStartTime: null
                });
            } catch (err) { }
        };

        const { evaluateDailyAttendance } = require('../utils/attendanceEvaluation');
        const todayStr = new Date().toISOString().split('T')[0];

        if (newTotalWorked >= targetSeconds) {
            session.endTime = now;
            session.status = 'Ended';
            await session.save();

            user.todayWorkedSeconds = newTotalWorked;
            user.isOnline = false;
            user.lastActive = new Date();
            await user.save();

            await evaluateDailyAttendance(userId, todayStr);
            emitOffline();

            return res.status(200).json({ message: 'Congratulations! You have completed your working hours for today.', session });
        } else if (newTotalWorked < minSessionSeconds) {
            session.endTime = now;
            session.status = 'Ended';
            await session.save();

            user.todayWorkedSeconds = newTotalWorked;
            user.isOnline = false;
            user.lastActive = new Date();
            user.forceAbsentToday = true;
            await user.save();

            await evaluateDailyAttendance(userId, todayStr);
            emitOffline();

            return res.status(200).json({ message: 'Minimum session not completed. Shift ended.', session });
        } else {
            session.startTime = now;
            session.status = 'Paused';
            await session.save();

            user.todayWorkedSeconds = newTotalWorked;
            user.isOnline = false;
            user.lastActive = new Date();
            await user.save();

            emitOffline();

            return res.status(200).json({ message: 'Minimum session completed. Please return to complete full working hours.', session });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.endSession = async (req, res) => {
    try {
        const userId = req.user._id;
        const session = await Session.findOne({ userId, status: { $in: ['Active', 'Paused'] } });

        if (!session) {
            return res.status(400).json({ message: 'No active or paused session found' });
        }

        let addedDuration = 0;
        if (session.status === 'Active') {
            const now = Date.now();
            addedDuration = Math.floor((now - session.startTime.getTime()) / 1000);
        }

        session.duration += addedDuration;
        session.endTime = Date.now();
        session.status = 'Ended';
        await session.save();

        const user = await User.findById(userId);
        user.todayWorkedSeconds += addedDuration;
        user.isOnline = false;
        user.lastActive = new Date();

        let settings = await Settings.findOne();
        if (!settings) settings = { targetHours: 8 };
        const targetSeconds = settings.targetHours * 3600;

        const { evaluateDailyAttendance } = require('../utils/attendanceEvaluation');
        const todayStr = new Date().toISOString().split('T')[0];
        const { getIO } = require('../config/socket');

        const emitOffline = () => {
            try {
                getIO().emit('employeeStatusUpdated', {
                    userId: user._id.toString(),
                    isOnline: false,
                    statusState: 'Offline',
                    lastActive: user.lastActive,
                    todayWorkedSeconds: user.todayWorkedSeconds,
                    todayActiveSeconds: user.todayActiveSeconds || 0,
                    todayIdleSeconds: user.todayIdleSeconds || 0,
                    todayAwaySeconds: user.todayAwaySeconds || 0,
                    sessionStartTime: null
                });
            } catch (err) { }
        };

        if (user.todayWorkedSeconds >= targetSeconds) {
            await user.save();
            await evaluateDailyAttendance(userId, todayStr);

            emitOffline();

            return res.status(200).json({
                message: 'Congratulations! You have completed your working hours for today.',
                totalWorkedSeconds: user.todayWorkedSeconds
            });
        } else {
            user.forceAbsentToday = true;
            await user.save();
            await evaluateDailyAttendance(userId, todayStr);

            emitOffline();

            return res.status(200).json({
                message: 'Shift ended early. Minimum required hours not met.',
                totalWorkedSeconds: user.todayWorkedSeconds
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

exports.getSessionStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const session = await Session.findOne({ userId, status: { $in: ['Active', 'Paused'] } });
        const user = await User.findById(userId).select('todayWorkedSeconds');
        res.status(200).json({
            session,
            todayWorkedSeconds: user ? user.todayWorkedSeconds : 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.forceEndAbruptSession = async (userId) => {
    try {
        const session = await Session.findOne({ userId, status: { $in: ['Active', 'Paused'] } });
        if (!session) return; // Already ended

        let addedDuration = 0;
        if (session.status === 'Active') {
            const now = Date.now();
            addedDuration = Math.floor((now - session.startTime.getTime()) / 1000);
        }

        session.duration += addedDuration;
        session.endTime = Date.now();
        session.status = 'Ended';
        await session.save();

        const user = await User.findById(userId);
        if (user) {
            user.todayWorkedSeconds += addedDuration;
            user.isOnline = false;
            user.lastActive = new Date();
            // DO NOT forceAbsent here. Only save the time, the dailyReset cron will gracefully evaluate total time and mark present or absent!
            await user.save();

            const { getIO } = require('../config/socket');
            try { getIO().emit('employeeStatusUpdated', { userId: user._id.toString(), isOnline: false, lastActive: user.lastActive, todayWorkedSeconds: user.todayWorkedSeconds, sessionStartTime: null }); } catch (err) { }
        }
        console.log(`[System] Force ended session for user ${userId} due to prolonged disconnect.`);
    } catch (err) {
        console.error('Error forcefully ending abrupt session:', err);
    }
};

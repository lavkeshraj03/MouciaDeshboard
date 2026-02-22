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
                            lastActive: resumedUser.lastActive
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
                    lastActive: user.lastActive
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

        session.duration += durationSinceStart;
        session.startTime = now; // reset start time to now in case it resumes
        session.status = 'Paused';
        await session.save();

        // Update User's todayWorkedSeconds and isOnline
        const user = await User.findById(userId);
        user.todayWorkedSeconds += durationSinceStart;
        user.isOnline = false;
        user.lastActive = new Date();
        if (req.body.forceAbsent) {
            user.forceAbsentToday = true;
        }
        await user.save();

        const { getIO } = require('../config/socket');
        try {
            getIO().emit('employeeStatusUpdated', {
                userId: user._id.toString(),
                isOnline: false,
                lastActive: user.lastActive
            });
        } catch (err) {
            console.error('Socket emit error:', err);
        }

        res.status(200).json({ message: 'Session paused', session });
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
        if (req.body.forceAbsent) {
            user.forceAbsentToday = true;
        }
        await user.save();

        const { getIO } = require('../config/socket');
        try {
            getIO().emit('employeeStatusUpdated', {
                userId: user._id.toString(),
                isOnline: false,
                lastActive: user.lastActive
            });
        } catch (err) {
            console.error('Socket emit error:', err);
        }

        // Mark Attendance on Shift Completion
        let settings = await Settings.findOne();
        if (!settings) settings = { defaultShiftHours: 8, minimumSessionMinutes: 120 };
        const targetSeconds = settings.defaultShiftHours * 3600;
        const halfDaySeconds = targetSeconds * 0.75;

        const today = new Date().toISOString().split('T')[0];
        let attendance = await Attendance.findOne({ userId, date: today });

        const totalWorkedToday = user.todayWorkedSeconds;
        let status = 'Incomplete';

        if (user.forceAbsentToday) {
            status = 'Absent';
        } else if (totalWorkedToday >= targetSeconds) {
            status = 'Present';
        } else if (totalWorkedToday >= halfDaySeconds) {
            status = 'Half Day';
        } else {
            status = 'Absent';
        }

        if (attendance) {
            attendance.totalWorkedSeconds = totalWorkedToday;
            attendance.status = status;
            attendance.completedShift = true;
            await attendance.save();
        } else {
            await Attendance.create({
                userId,
                date: today,
                totalWorkedSeconds: totalWorkedToday,
                status,
                completedShift: true
            });
        }

        res.status(200).json({
            message: 'Session ended successfully and attendance marked',
            totalWorkedSeconds: user.todayWorkedSeconds,
            warning: user.todayWorkedSeconds < 7200 ? 'Minimum session duration is 2 hours' : null
        });
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
            user.forceAbsentToday = true;
            await user.save();
        }
        console.log(`[System] Force ended session for user ${userId} due to prolonged disconnect.`);
    } catch (err) {
        console.error('Error forcefully ending abrupt session:', err);
    }
};

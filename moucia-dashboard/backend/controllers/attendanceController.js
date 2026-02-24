const Attendance = require('../models/Attendance');
const Session = require('../models/Session');

exports.getAttendanceLogs = async (req, res) => {
    try {
        const logs = await Attendance.find({ userId: req.user._id })
            .sort({ date: -1 })
            .limit(30)
            .lean();

        // Attach sessions to each log
        const logsWithSessions = await Promise.all(logs.map(async (log) => {
            const sessions = await Session.find({ userId: req.user._id, date: log.date }).sort({ startTime: 1 }).lean();
            return { ...log, sessions };
        }));

        res.status(200).json({ logs: logsWithSessions });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getTodayAttendance = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const attendance = await Attendance.findOne({ userId: req.user._id, date: today }).lean();

        if (attendance) {
            const sessions = await Session.find({ userId: req.user._id, date: today }).sort({ startTime: 1 }).lean();
            attendance.sessions = sessions;
        }

        res.status(200).json({ attendance });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getWeeklySummary = async (req, res) => {
    try {
        const attendances = await Attendance.find({ userId: req.user._id })
            .sort({ date: -1 })
            .limit(7);

        res.status(200).json({ attendances });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAllAttendanceLogs = async (req, res) => {
    try {
        const logs = await Attendance.find({})
            .populate('userId', 'name email role department')
            .sort({ date: -1 })
            .limit(100) // Added limit for performance
            .lean();

        // Attach sessions to each log
        const logsWithSessions = await Promise.all(logs.map(async (log) => {
            const userId = log.userId ? log.userId._id : null;
            if (userId) {
                const sessions = await Session.find({ userId, date: log.date }).sort({ startTime: 1 }).lean();
                return { ...log, sessions };
            }
            return { ...log, sessions: [] };
        }));

        res.status(200).json({ logs: logsWithSessions });
    } catch (error) {
        console.error('Error fetching all attendances:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

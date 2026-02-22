const Attendance = require('../models/Attendance');

exports.getAttendanceLogs = async (req, res) => {
    try {
        const logs = await Attendance.find({ userId: req.user._id })
            .sort({ date: -1 })
            .limit(30);

        res.status(200).json({ logs });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getTodayAttendance = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const attendance = await Attendance.findOne({ userId: req.user._id, date: today });

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
            .sort({ date: -1 });

        res.status(200).json({ logs });
    } catch (error) {
        console.error('Error fetching all attendances:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const DailyReport = require('../models/DailyReport');

exports.submitReport = async (req, res) => {
    try {
        const { achievements, challenges, tomorrowPlan } = req.body;
        const report = await DailyReport.create({
            userId: req.user._id,
            achievements,
            challenges,
            tomorrowPlan
        });
        res.status(201).json({ message: 'Report submitted successfully', report });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getEmployeeReports = async (req, res) => {
    try {
        const reports = await DailyReport.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ reports });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAllReports = async (req, res) => {
    try {
        const reports = await DailyReport.find().populate('userId', 'name role').sort({ createdAt: -1 });
        res.status(200).json({ reports });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

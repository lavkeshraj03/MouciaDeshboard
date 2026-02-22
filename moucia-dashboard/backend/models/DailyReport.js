const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    achievements: {
        type: String,
        required: true
    },
    challenges: {
        type: String
    },
    tomorrowPlan: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('DailyReport', dailyReportSchema);

const mongoose = require('mongoose');

const dailyProductivitySchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // String 'YYYY-MM-DD'
        required: true
    },
    totalWorkedSeconds: {
        type: Number,
        default: 0
    },
    totalActiveSeconds: {
        type: Number,
        default: 0
    },
    totalIdleSeconds: {
        type: Number,
        default: 0
    },
    totalAwaySeconds: {
        type: Number,
        default: 0
    },
    productivityScore: {
        type: Number, // Percentage 0-100
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('DailyProductivity', dailyProductivitySchema);

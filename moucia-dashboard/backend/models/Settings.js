const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    companyName: {
        type: String,
        default: 'Moucia'
    },
    targetHours: {
        type: Number,
        default: 8
    },
    minimumSessionBuffer: {
        type: Number,
        default: 120
    },
    allowRemoteWork: {
        type: Boolean,
        default: true
    },
    requireLocationTracking: {
        type: Boolean,
        default: false
    },
    weeklyOffDays: {
        type: [String],
        default: ['Saturday', 'Sunday']
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);

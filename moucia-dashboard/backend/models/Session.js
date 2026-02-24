const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    activeSeconds: {
        type: Number, // in seconds
        default: 0
    },
    idleSeconds: {
        type: Number, // in seconds
        default: 0
    },
    awaySeconds: {
        type: Number, // in seconds
        default: 0
    },
    productivityScore: {
        type: Number, // percentage out of 100
        default: 100
    },
    status: {
        type: String,
        enum: ['Active', 'Paused', 'Ended'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);

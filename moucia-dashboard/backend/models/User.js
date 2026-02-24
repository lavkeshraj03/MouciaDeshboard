const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Admin', 'Manager', 'Developer', 'Tester', 'UI/UX', 'Sales', 'HR'],
        default: 'Developer'
    },
    department: {
        type: String,
        default: 'Engineering'
    },
    joiningDate: {
        type: Date,
        default: Date.now
    },
    reportingTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    workLocation: {
        type: String,
        enum: ['On-site', 'Remote', 'Hybrid'],
        default: 'Hybrid'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastActive: {
        type: Date,
        default: null
    },
    todayWorkedSeconds: {
        type: Number,
        default: 0
    },
    todayActiveSeconds: {
        type: Number,
        default: 0
    },
    todayIdleSeconds: {
        type: Number,
        default: 0
    },
    todayAwaySeconds: {
        type: Number,
        default: 0
    },
    forceAbsentToday: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

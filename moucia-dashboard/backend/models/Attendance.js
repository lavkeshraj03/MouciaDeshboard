const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // String 'YYYY-MM-DD' helps querying easily
        required: true
    },
    totalWorkedSeconds: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        enum: ['Present', 'Half Day', 'Absent'],
        required: true
    },
    completedShift: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

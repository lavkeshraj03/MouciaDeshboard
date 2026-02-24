const mongoose = require('mongoose');

const taskWorkLogSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    timeSpentSeconds: {
        type: Number,
        required: true,
        default: 0
    },
    description: {
        type: String,
        default: ''
    },
    completed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('TaskWorkLog', taskWorkLogSchema);

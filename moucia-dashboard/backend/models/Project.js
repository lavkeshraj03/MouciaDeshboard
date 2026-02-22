const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    category: {
        type: String, // e.g., 'Web App', 'Mobile App', 'Design'
        required: true
    },
    team: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Delivered', 'Completed', 'On Hold'],
        default: 'Pending'
    },
    dueDate: {
        type: Date
    },
    deliverableDate: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);

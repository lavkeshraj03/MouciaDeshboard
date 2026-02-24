const Task = require('../models/Task');
const Notification = require('../models/Notification');
const TaskWorkLog = require('../models/TaskWorkLog');

exports.getEmployeeTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ assignedTo: req.user._id });
        res.status(200).json({ tasks });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateTaskStatus = async (req, res) => {
    try {
        const { taskId, status } = req.body;
        const task = await Task.findOneAndUpdate(
            { _id: taskId, assignedTo: req.user._id },
            { status },
            { new: true }
        );
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.status(200).json({ task });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find().populate('assignedTo', 'name email').sort({ createdAt: -1 });
        res.status(200).json({ tasks });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createTask = async (req, res) => {
    try {
        const { title, description, assignedTo, priority, dueDate } = req.body;
        const task = await Task.create({
            title,
            description,
            assignedTo,
            priority,
            dueDate,
            status: 'Pending'
        });

        // Trigger notification to assigned user
        if (assignedTo) {
            await Notification.create({
                userId: assignedTo,
                title: 'New Task Assigned',
                message: `You have been assigned a new task: "${title}"`,
                type: 'Task'
            });
        }

        res.status(201).json({ message: 'Task created successfully', task });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.status(200).json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.logTaskTime = async (req, res) => {
    try {
        const { taskId, timeSpentSeconds, description, completed } = req.body;
        const dateString = new Date().toISOString().split('T')[0];

        const log = await TaskWorkLog.create({
            employeeId: req.user._id,
            taskId,
            date: dateString,
            timeSpentSeconds,
            description,
            completed
        });

        if (completed) {
            await Task.findByIdAndUpdate(taskId, { status: 'Completed' });
        }

        res.status(201).json({ message: 'Task time logged successfully', log });
    } catch (error) {
        console.error('Log Task Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getTaskLogs = async (req, res) => {
    try {
        const { date } = req.query; // optional date filter
        let query = {};
        if (date) query.date = date;

        let logs;
        if (req.user.role === 'Admin') {
            logs = await TaskWorkLog.find(query).populate('employeeId', 'name').populate('taskId', 'title');
        } else {
            query.employeeId = req.user._id;
            logs = await TaskWorkLog.find(query).populate('taskId', 'title');
        }

        res.status(200).json({ logs });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

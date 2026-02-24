const User = require('../models/User');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');

exports.getStats = async (req, res) => {
    try {
        const totalEmployees = await User.countDocuments({ role: { $ne: 'Admin' } });
        const onlineEmployees = await User.countDocuments({ role: { $ne: 'Admin' }, isOnline: true });

        const totalTasks = await Task.countDocuments();
        const activeProjects = await Task.countDocuments({ status: { $ne: 'Completed' } });
        const tasksInProgress = await Task.countDocuments({ status: 'In Progress' });
        const completedTasks = await Task.countDocuments({ status: 'Completed' });

        const employeesPercent = totalEmployees > 0 ? Math.round((onlineEmployees / totalEmployees) * 100) : 0;
        const activeProjectsPercent = totalTasks > 0 ? Math.round((activeProjects / totalTasks) * 100) : 0;
        const tasksInProgressPercent = totalTasks > 0 ? Math.round((tasksInProgress / totalTasks) * 100) : 0;
        const completedTasksPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        res.status(200).json({
            stats: {
                totalEmployees,
                employeesPercent,
                activeProjects,
                activeProjectsPercent,
                tasksInProgress,
                tasksInProgressPercent,
                completedTasks,
                completedTasksPercent
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getWorkforceStatus = async (req, res) => {
    try {
        // Fetch all users except admins
        const users = await User.find({ role: { $ne: 'Admin' } })
            .select('name email role department joiningDate reportingTo workLocation isActive isOnline todayWorkedSeconds todayActiveSeconds todayIdleSeconds todayAwaySeconds')
            .populate('reportingTo', 'name')
            .sort({ isOnline: -1, name: 1 });

        const Session = require('../models/Session');
        const activeSessions = await Session.find({ status: 'Active' });
        const sessionMap = {};
        activeSessions.forEach(s => { sessionMap[s.userId.toString()] = s.startTime; });

        // Fetch active settings for shift target logic
        const Settings = require('../models/Settings');
        let settings = await Settings.findOne();
        if (!settings) settings = { targetHours: 8 };
        const targetSeconds = settings.targetHours * 3600;

        // Fetch today's task work logs
        const TaskWorkLog = require('../models/TaskWorkLog');
        const todayStr = new Date().toISOString().split('T')[0];
        const taskLogs = await TaskWorkLog.find({ date: todayStr });
        const taskLogMap = {};
        taskLogs.forEach(log => {
            const empId = log.employeeId.toString();
            if (!taskLogMap[empId]) taskLogMap[empId] = 0;
            taskLogMap[empId] += log.timeSpentSeconds;
        });

        // Map data required for Admin live ticking
        const workforce = users.map(user => {
            const hasActiveSession = sessionMap[user._id.toString()] !== undefined;
            return {
                id: user._id,
                userId: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                joiningDate: user.joiningDate,
                reportingTo: user.reportingTo,
                workLocation: user.workLocation,
                isActive: user.isActive,
                status: hasActiveSession ? 'Online' : 'Offline',
                statusState: hasActiveSession ? 'Active' : 'Offline',
                todayWorkedSeconds: user.todayWorkedSeconds,
                todayTaskLoggedSeconds: taskLogMap[user._id.toString()] || 0,
                todayActiveSeconds: user.todayActiveSeconds || 0,
                todayIdleSeconds: user.todayIdleSeconds || 0,
                todayAwaySeconds: user.todayAwaySeconds || 0,
                targetSeconds: targetSeconds,
                sessionStartTime: sessionMap[user._id.toString()] || null
            };
        });

        res.status(200).json({ workforce });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        // Attendance Analytics (Donut Chart)
        const today = new Date().toISOString().split('T')[0];
        const onTime = await Attendance.countDocuments({ date: today, status: 'Present' });
        const late = await Attendance.countDocuments({ date: today, status: 'Half Day' });
        const absent = await User.countDocuments({ role: { $ne: 'Admin' } }) - onTime - late;

        const attendanceData = [
            { name: 'On-time', value: onTime, color: '#2563EB' },
            { name: 'Late', value: late, color: '#F59E0B' },
            { name: 'Absent', value: Math.max(0, absent), color: '#EF4444' }
        ];

        // Weekly Activity (Bar Chart) - Real data for the last 7 days
        const weeklyActivity = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);

            const dailyRecords = await Attendance.find({ date: dateString });
            const totalSeconds = dailyRecords.reduce((acc, curr) => acc + curr.totalWorkedSeconds, 0);

            weeklyActivity.push({
                name: dayName,
                hours: parseFloat((totalSeconds / 3600).toFixed(1))
            });
        }

        res.status(200).json({
            attendanceData,
            weeklyActivity
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateEmployeeProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, department, joiningDate, reportingTo, workLocation, isActive, email } = req.body;

        const updateData = {};
        if (role) updateData.role = role;
        if (department) updateData.department = department;
        if (joiningDate) updateData.joiningDate = joiningDate;
        if (reportingTo !== undefined) updateData.reportingTo = reportingTo || null;
        if (workLocation) updateData.workLocation = workLocation;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (email) updateData.email = email;

        const user = await User.findByIdAndUpdate(id, updateData, { new: true }).populate('reportingTo', 'name');

        if (!user) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Emit real-time profile update socket event
        const { getIO } = require('../config/socket');
        try {
            const io = getIO();
            if (io) {
                io.emit('employeeProfileUpdated', {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                    joiningDate: user.joiningDate,
                    reportingTo: user.reportingTo ? user.reportingTo.name : 'Admin Manager',
                    workLocation: user.workLocation,
                    isActive: user.isActive
                });
            }
        } catch (err) {
            console.error('Socket emit error on profile update:', err);
        }

        res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Update Employee Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

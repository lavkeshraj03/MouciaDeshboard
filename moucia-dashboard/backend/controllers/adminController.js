const User = require('../models/User');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');

exports.getStats = async (req, res) => {
    try {
        const totalEmployees = await User.countDocuments({ role: { $ne: 'Admin' } });
        const activeProjects = await Task.countDocuments({ status: { $ne: 'Completed' } }); // Proxy for active projects
        const tasksInProgress = await Task.countDocuments({ status: 'In Progress' });
        const completedTasks = await Task.countDocuments({ status: 'Completed' });

        res.status(200).json({
            stats: {
                totalEmployees,
                activeProjects,
                tasksInProgress,
                completedTasks
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
            .select('name email role department joiningDate reportingTo workLocation isActive isOnline todayWorkedSeconds')
            .populate('reportingTo', 'name')
            .sort({ isOnline: -1, name: 1 });

        // Map status and calculate productivity (mock logic for now)
        const workforce = users.map(user => ({
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
            status: user.isOnline ? 'Online' : 'Offline',
            workedToday: (user.todayWorkedSeconds / 3600).toFixed(1) + 'h',
            remaining: Math.max(0, 8 - (user.todayWorkedSeconds / 3600)).toFixed(1) + 'h',
            productivity: Math.min(100, Math.round((user.todayWorkedSeconds / (8 * 3600)) * 100))
        }));

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

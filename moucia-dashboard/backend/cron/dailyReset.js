const cron = require('node-cron');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const Settings = require('../models/Settings');

const initCronJobs = () => {
    // Run at 03:00 AM every day
    cron.schedule('0 3 * * *', async () => {
        console.log('Running daily reset cron job...');
        try {
            const today = new Date();
            // To save it under the previous day if running at 3 AM:
            const recordDate = new Date(today);
            recordDate.setDate(recordDate.getDate() - 1);
            const dateString = recordDate.toISOString().split('T')[0];

            // Fetch global settings
            let settings = await Settings.findOne();
            if (!settings) settings = { defaultShiftHours: 8, minimumSessionMinutes: 120 };

            const minSessionSeconds = settings.minimumSessionMinutes * 60;

            // 1. Close active sessions
            const openSessions = await Session.find({ status: { $in: ['Active', 'Paused'] } });
            for (let session of openSessions) {
                let addedDuration = 0;
                if (session.status === 'Active') {
                    const now = Date.now();
                    addedDuration = Math.floor((now - session.startTime.getTime()) / 1000);
                }

                // Only count the session if it meets the minimum continuous duration required
                if (session.status === 'Active' && addedDuration < minSessionSeconds) {
                    addedDuration = 0; // Discard partial session that didn't meet the buffer rule
                }

                session.duration += addedDuration;
                session.endTime = new Date();
                session.status = 'Ended';
                await session.save();

                const user = await User.findById(session.userId);
                if (user) {
                    user.todayWorkedSeconds += addedDuration;
                    await user.save();
                }
            }

            // 2. Finalize attendance and reset counters
            const users = await User.find({});
            const targetSeconds = settings.defaultShiftHours * 3600;
            const halfDaySeconds = targetSeconds * 0.75; // 75% of target shift implies half-day

            for (let user of users) {
                let status = 'Absent';
                let completedShift = false;

                // Logic based on global settings targets
                if (user.forceAbsentToday) {
                    status = 'Absent';
                } else if (user.todayWorkedSeconds >= targetSeconds) {
                    status = 'Present';
                    completedShift = true;
                } else if (user.todayWorkedSeconds >= halfDaySeconds) {
                    status = 'Half Day';
                }

                await Attendance.create({
                    userId: user._id,
                    date: dateString,
                    totalWorkedSeconds: user.todayWorkedSeconds,
                    status,
                    completedShift
                });

                // Reset
                user.todayWorkedSeconds = 0;
                user.forceAbsentToday = false;
                await user.save();
            }

            console.log('Daily reset completed successfully.');
        } catch (error) {
            console.error('Error in daily reset cron job:', error);
        }
    });
};

module.exports = initCronJobs;

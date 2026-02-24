const cron = require('node-cron');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const Settings = require('../models/Settings');
const DailyProductivity = require('../models/DailyProductivity');

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
            if (!settings) settings = { targetHours: 8, minimumSessionBuffer: 120 };

            const minSessionSeconds = settings.minimumSessionBuffer * 60;

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
            const { evaluateDailyAttendance } = require('../utils/attendanceEvaluation');

            for (let user of users) {
                // If they have accumulated time, evaluate and log it.
                // Call evaluateDailyAttendance BEFORE resetting counters
                await evaluateDailyAttendance(user._id, dateString);

                // Archive Daily Productivity Details
                const totalTracked = user.todayActiveSeconds + user.todayIdleSeconds + user.todayAwaySeconds;
                let finalScore = 100;
                if (totalTracked > 0) {
                    finalScore = Math.round((user.todayActiveSeconds / totalTracked) * 100);
                }

                // Create the immutable daily productivity payload
                if (user.todayWorkedSeconds > 0) {
                    await DailyProductivity.create({
                        employeeId: user._id,
                        date: dateString,
                        totalWorkedSeconds: user.todayWorkedSeconds,
                        totalActiveSeconds: user.todayActiveSeconds,
                        totalIdleSeconds: user.todayIdleSeconds,
                        totalAwaySeconds: user.todayAwaySeconds,
                        productivityScore: finalScore
                    });
                }

                // Reset
                user.todayWorkedSeconds = 0;
                user.todayActiveSeconds = 0;
                user.todayIdleSeconds = 0;
                user.todayAwaySeconds = 0;
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

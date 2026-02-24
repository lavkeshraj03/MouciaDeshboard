const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Settings = require('../models/Settings');

/**
 * Centrally evaluates and updates the attendance status for a given user and date.
 * If target logic is met, marks Present. Otherwise Absent.
 * 
 * @param {String} userId - The unique ID of the employee
 * @param {String} dateString - "YYYY-MM-DD"
 * @returns {Object} { status: "Present" | "Absent", totalWorkedSeconds }
 */
const evaluateDailyAttendance = async (userId, dateString) => {
    try {
        const user = await User.findById(userId);
        if (!user) return null;

        let settings = await Settings.findOne();
        if (!settings) settings = { targetHours: 8 };

        const targetSeconds = settings.targetHours * 3600;
        const totalWorkedSeconds = user.todayWorkedSeconds;

        let status = 'Absent';

        if (user.forceAbsentToday) {
            status = 'Absent';
        } else if (totalWorkedSeconds >= targetSeconds) {
            status = 'Present';
        }

        // Upsert the Attendance record
        let attendance = await Attendance.findOne({ userId, date: dateString });

        if (attendance) {
            attendance.totalWorkedSeconds = totalWorkedSeconds;
            // Never downgrade Present to Pending if evaluating
            attendance.status = status;
            attendance.completedShift = (status === 'Present');
            await attendance.save();
        } else {
            attendance = await Attendance.create({
                userId,
                date: dateString,
                totalWorkedSeconds,
                status,
                completedShift: (status === 'Present')
            });
        }

        return { status, totalWorkedSeconds, targetSeconds };

    } catch (err) {
        console.error(`[Evaluation Engine] Error evaluating attendance for user ${userId}:`, err);
        return null;
    }
};

module.exports = { evaluateDailyAttendance };

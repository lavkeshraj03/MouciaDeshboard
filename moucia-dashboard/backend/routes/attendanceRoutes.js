const express = require('express');
const router = express.Router();
const { getTodayAttendance, getWeeklySummary, getAttendanceLogs, getAllAttendanceLogs } = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/all', protect, admin, getAllAttendanceLogs); // Admin endpoint
router.get('/', protect, getAttendanceLogs); // User endpoint
router.get('/today', protect, getTodayAttendance);
router.get('/weekly', protect, getWeeklySummary);

module.exports = router;

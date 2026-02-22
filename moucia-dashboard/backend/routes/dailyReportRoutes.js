const express = require('express');
const router = express.Router();
const { submitReport, getEmployeeReports, getAllReports } = require('../controllers/dailyReportController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, submitReport);
router.get('/', protect, getEmployeeReports);
router.get('/admin/all', protect, getAllReports);

module.exports = router;

const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getStats, getWorkforceStatus, getAnalytics, updateEmployeeProfile } = require('../controllers/adminController');
const { getSettings, updateSettings } = require('../controllers/settingsController');

const router = express.Router();

// Role-based protection middleware
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admins only' });
    }
};

router.get('/stats', protect, adminOnly, getStats);
router.get('/workforce', protect, adminOnly, getWorkforceStatus);
router.put('/workforce/:id', protect, adminOnly, updateEmployeeProfile);
router.get('/analytics', protect, adminOnly, getAnalytics);
router.get('/settings', protect, adminOnly, getSettings);
router.put('/settings', protect, adminOnly, updateSettings);

module.exports = router;

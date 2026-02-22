const express = require('express');
const router = express.Router();
const { startSession, pauseSession, endSession, getSessionStatus } = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/start', protect, startSession);
router.post('/pause', protect, pauseSession);
router.post('/end', protect, endSession);
router.get('/status', protect, getSessionStatus);

module.exports = router;

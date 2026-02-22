const express = require('express');
const router = express.Router();
const { loginUser, setupAdmin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/setup-admin', setupAdmin); // Endpoint to initialize the first admin

module.exports = router;

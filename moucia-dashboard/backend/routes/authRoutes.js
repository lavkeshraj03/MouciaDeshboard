const express = require('express');
const router = express.Router();
const { loginUser, setupAdmin, getMe, updateProfileImage } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile-image', protect, updateProfileImage);
router.post('/setup-admin', setupAdmin); // Endpoint to initialize the first admin

module.exports = router;

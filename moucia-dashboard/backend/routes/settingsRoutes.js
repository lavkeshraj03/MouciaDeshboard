const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getSettings } = require('../controllers/settingsController');

const router = express.Router();

router.get('/', protect, getSettings);

module.exports = router;

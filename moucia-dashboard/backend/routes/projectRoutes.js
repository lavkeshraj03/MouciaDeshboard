const express = require('express');
const router = express.Router();
const { createProject, getAllProjects, updateProject, deleteProject } = require('../controllers/projectController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, createProject);
router.get('/', protect, getAllProjects); // Maybe employees need to see projects too, so just protect
router.put('/:id', protect, admin, updateProject);
router.delete('/:id', protect, admin, deleteProject);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getEmployeeTasks, updateTaskStatus, getAllTasks, createTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getEmployeeTasks);
router.get('/admin/all', protect, getAllTasks);
router.post('/admin', protect, createTask);
router.delete('/admin/:id', protect, deleteTask);
router.put('/status', protect, updateTaskStatus);

module.exports = router;

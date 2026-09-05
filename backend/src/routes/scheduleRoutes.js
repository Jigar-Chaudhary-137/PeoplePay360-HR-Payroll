const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', scheduleController.getSchedules);
router.get('/:id', scheduleController.getScheduleById);
router.post('/', authorizeRoles('Admin', 'HR Manager'), scheduleController.createSchedule);
router.put('/:id', authorizeRoles('Admin', 'HR Manager'), scheduleController.updateSchedule);

module.exports = router;

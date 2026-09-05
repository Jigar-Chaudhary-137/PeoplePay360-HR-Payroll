const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', scheduleController.getSchedules);
router.get('/:id', scheduleController.getScheduleById);
router.post('/', requireRole('HR Manager', 'Admin'), scheduleController.createSchedule);
router.put('/:id', requireRole('HR Manager', 'Admin'), scheduleController.updateSchedule);
router.delete('/:id', requireRole('HR Manager', 'Admin'), scheduleController.deleteSchedule);

module.exports = router;

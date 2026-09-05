const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
<<<<<<< HEAD
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
=======
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
>>>>>>> feature/backend

router.use(authenticateToken);

router.get('/', scheduleController.getSchedules);
router.get('/:id', scheduleController.getScheduleById);
<<<<<<< HEAD
router.post('/', authorizeRoles('Admin', 'HR Manager'), scheduleController.createSchedule);
router.put('/:id', authorizeRoles('Admin', 'HR Manager'), scheduleController.updateSchedule);
=======
router.post('/', requireRole('HR Manager'), scheduleController.createSchedule);
>>>>>>> feature/backend

module.exports = router;

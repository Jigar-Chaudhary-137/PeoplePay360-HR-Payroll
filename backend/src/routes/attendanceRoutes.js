const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', attendanceController.getAttendance);
router.get('/today', attendanceController.getTodayStatus);
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);

// Manual correction restricted to HR Manager or Admin
router.put('/:id', requireRole('HR Manager'), attendanceController.updateAttendance);

module.exports = router;

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', attendanceController.getAttendance);
router.get('/today', attendanceController.getMyTodayStatus);
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.put('/:id/correction', authorizeRoles('Admin', 'HR Manager'), attendanceController.manualCorrection);

module.exports = router;

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
<<<<<<< HEAD
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
=======
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
>>>>>>> feature/backend

router.use(authenticateToken);

router.get('/', attendanceController.getAttendance);
<<<<<<< HEAD
router.get('/today', attendanceController.getMyTodayStatus);
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.put('/:id/correction', authorizeRoles('Admin', 'HR Manager'), attendanceController.manualCorrection);
=======
router.get('/today', attendanceController.getTodayStatus);
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);

// Manual correction restricted to HR Manager or Admin
router.put('/:id', requireRole('HR Manager'), attendanceController.updateAttendance);
>>>>>>> feature/backend

module.exports = router;

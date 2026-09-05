const express = require('express');
const router = express.Router();
const timeOffController = require('../controllers/timeOffController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

// Types
router.get('/types', timeOffController.getTimeOffTypes);
router.post('/types', requireRole('HR Manager'), timeOffController.createTimeOffType);

// Allocations
router.get('/allocations', timeOffController.getTimeOffAllocations);
router.post('/allocations', requireRole('HR Manager'), timeOffController.createOrUpdateAllocation);

// Requests
router.get('/requests', timeOffController.getTimeOffRequests);
router.post('/requests', timeOffController.createTimeOffRequest);

// Approvals (HR Manager or Admin only)
router.patch('/requests/:id/approve', requireRole('HR Manager'), timeOffController.approveTimeOffRequest);
router.patch('/requests/:id/reject', requireRole('HR Manager'), timeOffController.rejectTimeOffRequest);

module.exports = router;

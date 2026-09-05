const express = require('express');
const router = express.Router();
const timeOffController = require('../controllers/timeOffController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/types', timeOffController.getTimeOffTypes);
router.get('/allocations', timeOffController.getAllocations);
router.post('/allocations', authorizeRoles('Admin', 'HR Manager'), timeOffController.setAllocation);
router.get('/requests', timeOffController.getRequests);
router.post('/requests', timeOffController.createRequest);
router.patch('/requests/:id/approve', authorizeRoles('Admin', 'HR Manager'), timeOffController.approveRequest);
router.patch('/requests/:id/reject', authorizeRoles('Admin', 'HR Manager'), timeOffController.rejectRequest);

module.exports = router;

const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', departmentController.getDepartments);
router.get('/job-positions', departmentController.getJobPositions);
router.post('/', requireRole('HR Manager'), departmentController.createDepartment);

module.exports = router;


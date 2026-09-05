const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');
<<<<<<< HEAD

router.use(authenticateToken);

router.get('/', dashboardController.getDashboardMetrics);
=======
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

// Dashboard viewable by HR Manager, HR Payroll Admin, HR Payroll User, and Admin
router.get('/', requireRole('HR Manager', 'HR Payroll Admin', 'HR Payroll User'), dashboardController.getDashboardMetrics);
>>>>>>> feature/backend

module.exports = router;

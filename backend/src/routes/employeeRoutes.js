const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
<<<<<<< HEAD
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', authorizeRoles('Admin', 'HR Manager', 'HR Payroll Admin', 'HR Payroll User'), employeeController.getEmployees);
router.get('/:id', employeeController.getEmployeeById); // Supports Employee self-view with ID check
router.post('/', authorizeRoles('Admin', 'HR Manager'), employeeController.createEmployee);
router.put('/:id', authorizeRoles('Admin', 'HR Manager'), employeeController.updateEmployee);
router.delete('/:id', authorizeRoles('Admin'), employeeController.deleteEmployee);
=======
const { authenticateToken } = require('../middleware/auth');
const { requireRole, requireSelfOrRole } = require('../middleware/rbac');

router.use(authenticateToken);

// Employee list: HR and Payroll roles and Admin can view
router.get('/', requireRole('HR Manager', 'HR Payroll Admin', 'HR Payroll User'), employeeController.getEmployees);

// Employee detail: Self or HR/Payroll
router.get('/:id', requireSelfOrRole('HR Manager', 'HR Payroll Admin', 'HR Payroll User'), employeeController.getEmployeeById);

// Create / Update / Delete: HR Manager or Admin
router.post('/', requireRole('HR Manager'), employeeController.createEmployee);
router.put('/:id', requireRole('HR Manager'), employeeController.updateEmployee);
router.delete('/:id', requireRole('HR Manager'), employeeController.deleteEmployee);
>>>>>>> feature/backend

module.exports = router;

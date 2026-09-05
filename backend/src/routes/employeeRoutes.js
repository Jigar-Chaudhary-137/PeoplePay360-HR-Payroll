const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
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

module.exports = router;

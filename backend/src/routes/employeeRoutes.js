const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', authorizeRoles('Admin', 'HR Manager', 'HR Payroll Admin', 'HR Payroll User'), employeeController.getEmployees);
router.get('/:id', employeeController.getEmployeeById); // Supports Employee self-view with ID check
router.post('/', authorizeRoles('Admin', 'HR Manager'), employeeController.createEmployee);
router.put('/:id', authorizeRoles('Admin', 'HR Manager'), employeeController.updateEmployee);
router.delete('/:id', authorizeRoles('Admin'), employeeController.deleteEmployee);

module.exports = router;

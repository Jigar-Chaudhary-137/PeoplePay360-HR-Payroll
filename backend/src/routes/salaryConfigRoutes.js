const express = require('express');
const router = express.Router();
const salaryConfigController = require('../controllers/salaryConfigController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// Structures
router.get('/structures', authorizeRoles('Admin', 'HR Payroll Admin', 'HR Payroll User'), salaryConfigController.getSalaryStructures);
router.get('/structures/:id', authorizeRoles('Admin', 'HR Payroll Admin', 'HR Payroll User'), salaryConfigController.getSalaryStructureById);
router.post('/structures', authorizeRoles('Admin', 'HR Payroll Admin'), salaryConfigController.createSalaryStructure);

// Rules
router.get('/rules', authorizeRoles('Admin', 'HR Payroll Admin', 'HR Payroll User'), salaryConfigController.getSalaryRules);
router.post('/rules', authorizeRoles('Admin', 'HR Payroll Admin'), salaryConfigController.createSalaryRule);
router.put('/rules/:id', authorizeRoles('Admin', 'HR Payroll Admin'), salaryConfigController.updateSalaryRule);

module.exports = router;

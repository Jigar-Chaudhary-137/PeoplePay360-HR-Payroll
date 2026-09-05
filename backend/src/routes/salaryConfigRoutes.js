const express = require('express');
const router = express.Router();
const salaryStructureController = require('../controllers/salaryStructureController');
const salaryRuleController = require('../controllers/salaryRuleController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

// Salary Structures
router.get('/structures', requireRole('HR Payroll Admin', 'HR Payroll User', 'HR Manager', 'Admin'), salaryStructureController.getSalaryStructures);
router.get('/structures/:id', requireRole('HR Payroll Admin', 'HR Payroll User', 'HR Manager', 'Admin'), salaryStructureController.getSalaryStructureById);
router.post('/structures', requireRole('HR Payroll Admin', 'HR Manager', 'Admin'), salaryStructureController.createSalaryStructure);
router.put('/structures/:id', requireRole('HR Payroll Admin', 'HR Manager', 'Admin'), salaryStructureController.updateSalaryStructure);

// Salary Rules
router.get('/rules', requireRole('HR Payroll Admin', 'HR Payroll User', 'HR Manager', 'Admin'), salaryRuleController.getSalaryRules);
router.post('/rules', requireRole('HR Payroll Admin', 'HR Manager', 'Admin'), salaryRuleController.createSalaryRule);
router.put('/rules/:id', requireRole('HR Payroll Admin', 'HR Manager', 'Admin'), salaryRuleController.updateSalaryRule);

module.exports = router;

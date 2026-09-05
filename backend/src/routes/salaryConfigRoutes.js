const express = require('express');
const router = express.Router();
<<<<<<< HEAD
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
=======
const salaryStructureController = require('../controllers/salaryStructureController');
const salaryRuleController = require('../controllers/salaryRuleController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

// Salary Structures
router.get('/structures', requireRole('HR Payroll Admin', 'HR Payroll User', 'HR Manager'), salaryStructureController.getSalaryStructures);
router.get('/structures/:id', requireRole('HR Payroll Admin', 'HR Payroll User', 'HR Manager'), salaryStructureController.getSalaryStructureById);
router.post('/structures', requireRole('HR Payroll Admin'), salaryStructureController.createSalaryStructure);
router.put('/structures/:id', requireRole('HR Payroll Admin'), salaryStructureController.updateSalaryStructure);

// Salary Rules
router.get('/rules', requireRole('HR Payroll Admin', 'HR Payroll User'), salaryRuleController.getSalaryRules);
router.post('/rules', requireRole('HR Payroll Admin'), salaryRuleController.createSalaryRule);
router.put('/rules/:id', requireRole('HR Payroll Admin'), salaryRuleController.updateSalaryRule);
>>>>>>> feature/backend

module.exports = router;

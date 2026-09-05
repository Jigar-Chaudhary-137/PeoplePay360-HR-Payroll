const express = require('express');
const router = express.Router();
const payrunController = require('../controllers/payrunController');
<<<<<<< HEAD
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// Payrun routes protected for Payroll roles & Admin
router.get('/eligible-employees', authorizeRoles('Admin', 'HR Payroll Admin', 'HR Payroll User'), payrunController.getEligibleEmployees);
router.get('/', authorizeRoles('Admin', 'HR Payroll Admin', 'HR Payroll User'), payrunController.getPayruns);
router.get('/:id', authorizeRoles('Admin', 'HR Payroll Admin', 'HR Payroll User'), payrunController.getPayrunById);
router.post('/', authorizeRoles('Admin', 'HR Payroll Admin', 'HR Payroll User'), payrunController.createPayrun);
router.post('/:id/compute', authorizeRoles('Admin', 'HR Payroll Admin', 'HR Payroll User'), payrunController.computePayrun);
router.post('/:id/validate', authorizeRoles('Admin', 'HR Payroll Admin'), payrunController.validatePayrun);
router.post('/:id/mark-paid', authorizeRoles('Admin', 'HR Payroll Admin'), payrunController.markPaid);
=======
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

// All payrun routes require HR Payroll Admin or HR Payroll User (Employees blocked!)
router.get('/', requireRole('HR Payroll Admin', 'HR Payroll User'), payrunController.getPayruns);
router.get('/eligible-employees', requireRole('HR Payroll Admin', 'HR Payroll User'), payrunController.getEligibleEmployees);
router.get('/:id', requireRole('HR Payroll Admin', 'HR Payroll User'), payrunController.getPayrunById);
router.get('/:id/anomalies', requireRole('HR Payroll Admin', 'HR Payroll User'), payrunController.getPayrunAnomalies);

// State transitions: draft -> compute -> validate -> paid
router.post('/', requireRole('HR Payroll Admin', 'HR Payroll User'), payrunController.createPayrun);
router.post('/:id/compute', requireRole('HR Payroll Admin', 'HR Payroll User'), payrunController.computePayrun);
router.post('/:id/validate', requireRole('HR Payroll Admin'), payrunController.validatePayrun);
router.post('/:id/mark-paid', requireRole('HR Payroll Admin'), payrunController.markPayrunPaid);
>>>>>>> feature/backend

module.exports = router;

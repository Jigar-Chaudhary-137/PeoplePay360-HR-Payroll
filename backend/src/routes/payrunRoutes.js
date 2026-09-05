const express = require('express');
const router = express.Router();
const payrunController = require('../controllers/payrunController');
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

module.exports = router;

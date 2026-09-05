const express = require('express');
const router = express.Router();
const payslipController = require('../controllers/payslipController');
<<<<<<< HEAD
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', payslipController.getPayslips); // Role-filtered (Employee sees only own)
router.get('/:id', payslipController.getPayslipById);
router.get('/:id/pdf', payslipController.downloadPayslipPDF);
router.post('/:id/send', authorizeRoles('Admin', 'HR Payroll Admin', 'HR Payroll User'), payslipController.emailPayslip);
router.post('/bulk-send', authorizeRoles('Admin', 'HR Payroll Admin'), payslipController.emailBulkPayrun);
=======
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', payslipController.getPayslips);
router.get('/:id', payslipController.getPayslipById);
router.get('/:id/pdf', payslipController.downloadPayslipPDF);

// Email dispatch (HR Payroll Admin or HR Payroll User)
router.post('/:id/send-email', requireRole('HR Payroll Admin', 'HR Payroll User'), payslipController.sendPayslipEmailHandler);
router.post('/send-bulk', requireRole('HR Payroll Admin', 'HR Payroll User'), payslipController.sendBulkPayslipEmails);
>>>>>>> feature/backend

module.exports = router;

const express = require('express');
const router = express.Router();
const payslipController = require('../controllers/payslipController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', payslipController.getPayslips);
router.get('/:id', payslipController.getPayslipById);
router.get('/:id/pdf', payslipController.downloadPayslipPDF);

// Email dispatch (HR Payroll Admin or HR Payroll User)
router.post('/:id/send-email', requireRole('HR Payroll Admin', 'HR Payroll User'), payslipController.sendPayslipEmailHandler);
router.post('/:id/send', requireRole('HR Payroll Admin', 'HR Payroll User'), payslipController.sendPayslipEmailHandler);
router.post('/send-bulk', requireRole('HR Payroll Admin', 'HR Payroll User'), payslipController.sendBulkPayslipEmails);
router.post('/bulk-send', requireRole('HR Payroll Admin', 'HR Payroll User'), payslipController.sendBulkPayslipEmails);

module.exports = router;

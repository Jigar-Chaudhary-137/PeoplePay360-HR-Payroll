const express = require('express');
const router = express.Router();
const payslipController = require('../controllers/payslipController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', payslipController.getPayslips); // Role-filtered (Employee sees only own)
router.get('/:id', payslipController.getPayslipById);
router.get('/:id/pdf', payslipController.downloadPayslipPDF);
router.post('/:id/send', authorizeRoles('Admin', 'HR Payroll Admin', 'HR Payroll User'), payslipController.emailPayslip);
router.post('/bulk-send', authorizeRoles('Admin', 'HR Payroll Admin'), payslipController.emailBulkPayrun);

module.exports = router;

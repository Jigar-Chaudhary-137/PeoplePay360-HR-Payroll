const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole, requireSelfOrRole } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', requireRole('HR Manager', 'HR Payroll Admin', 'HR Payroll User'), contractController.getContracts);
router.get('/applicable', requireRole('HR Manager', 'HR Payroll Admin', 'HR Payroll User'), contractController.getApplicableContract);
router.get('/:id', requireRole('HR Manager', 'HR Payroll Admin', 'HR Payroll User'), contractController.getContractById);

router.post('/', requireRole('HR Manager', 'HR Payroll Admin'), contractController.createContract);
router.put('/:id', requireRole('HR Manager', 'HR Payroll Admin'), contractController.updateContract);

module.exports = router;

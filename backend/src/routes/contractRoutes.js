const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
<<<<<<< HEAD
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', authorizeRoles('Admin', 'HR Manager', 'HR Payroll Admin', 'HR Payroll User'), contractController.getContracts);
router.get('/:id', authorizeRoles('Admin', 'HR Manager', 'HR Payroll Admin', 'HR Payroll User'), contractController.getContractById);
router.post('/', authorizeRoles('Admin', 'HR Manager'), contractController.createContract);
router.put('/:id', authorizeRoles('Admin', 'HR Manager'), contractController.updateContract);
=======
const { authenticateToken } = require('../middleware/auth');
const { requireRole, requireSelfOrRole } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', requireRole('HR Manager', 'HR Payroll Admin', 'HR Payroll User'), contractController.getContracts);
router.get('/applicable', requireRole('HR Manager', 'HR Payroll Admin', 'HR Payroll User'), contractController.getApplicableContract);
router.get('/:id', requireRole('HR Manager', 'HR Payroll Admin', 'HR Payroll User'), contractController.getContractById);

router.post('/', requireRole('HR Manager', 'HR Payroll Admin'), contractController.createContract);
router.put('/:id', requireRole('HR Manager', 'HR Payroll Admin'), contractController.updateContract);
>>>>>>> feature/backend

module.exports = router;

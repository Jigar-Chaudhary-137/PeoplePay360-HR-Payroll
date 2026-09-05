const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', authorizeRoles('Admin', 'HR Manager', 'HR Payroll Admin', 'HR Payroll User'), contractController.getContracts);
router.get('/:id', authorizeRoles('Admin', 'HR Manager', 'HR Payroll Admin', 'HR Payroll User'), contractController.getContractById);
router.post('/', authorizeRoles('Admin', 'HR Manager'), contractController.createContract);
router.put('/:id', authorizeRoles('Admin', 'HR Manager'), contractController.updateContract);

module.exports = router;

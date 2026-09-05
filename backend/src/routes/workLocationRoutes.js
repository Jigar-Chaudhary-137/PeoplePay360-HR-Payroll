const express = require('express');
const router = express.Router();
const workLocationController = require('../controllers/workLocationController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', workLocationController.getWorkLocations);
router.get('/:id', workLocationController.getWorkLocationById);
router.post('/', requireRole('Admin', 'HR Manager'), workLocationController.createWorkLocation);
router.put('/:id', requireRole('Admin', 'HR Manager'), workLocationController.updateWorkLocation);
router.delete('/:id', requireRole('Admin', 'HR Manager'), workLocationController.deleteWorkLocation);

module.exports = router;

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const departmentController = require('../controllers/departmentController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

// Departments list — used by frontend filter dropdowns (accessible to HR Manager + Admin)
router.get('/departments', requireRole('Admin', 'HR Manager'), departmentController.getDepartments);

// User and role management is restricted to Admin
router.get('/', requireRole('Admin'), userController.getUsers);
router.get('/roles', requireRole('Admin', 'HR Manager'), userController.getRoles);
router.post('/', requireRole('Admin'), userController.createUser);
router.put('/:id', requireRole('Admin'), userController.updateUser);

module.exports = router;

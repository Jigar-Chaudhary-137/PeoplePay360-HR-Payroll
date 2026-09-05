const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
<<<<<<< HEAD
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/departments', userController.getDepartments);
router.get('/', authorizeRoles('Admin'), userController.getUsers);
router.post('/', authorizeRoles('Admin'), userController.createUser);
router.put('/:id', authorizeRoles('Admin'), userController.updateUser);
=======
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

// User and role management is restricted to Admin
router.get('/', requireRole('Admin'), userController.getUsers);
router.get('/roles', requireRole('Admin', 'HR Manager'), userController.getRoles);
router.post('/', requireRole('Admin'), userController.createUser);
router.put('/:id', requireRole('Admin'), userController.updateUser);
>>>>>>> feature/backend

module.exports = router;

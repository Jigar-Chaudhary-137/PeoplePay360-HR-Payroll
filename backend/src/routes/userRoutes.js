const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/departments', userController.getDepartments);
router.get('/', authorizeRoles('Admin'), userController.getUsers);
router.post('/', authorizeRoles('Admin'), userController.createUser);
router.put('/:id', authorizeRoles('Admin'), userController.updateUser);

module.exports = router;

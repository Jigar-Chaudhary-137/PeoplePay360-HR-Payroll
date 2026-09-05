const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe);
router.post('/switch-demo-role', authController.switchDemoRole);

module.exports = router;


const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe);
router.post('/switch-demo-role', authController.switchDemoRole);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-reset-token', authController.verifyResetToken);

module.exports = router;


const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/ask', aiController.handleAskAI);

module.exports = router;

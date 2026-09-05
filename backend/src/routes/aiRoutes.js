const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

<<<<<<< HEAD
router.post('/ask', aiController.handleAskAI);
=======
router.post('/ask', aiController.askAI);
>>>>>>> feature/backend

module.exports = router;

const { askAI } = require('../services/aiService');

async function handleAskAI(req, res) {
  const { question } = req.body;

  if (!question || typeof question !== 'string' || question.trim() === '') {
    return res.status(400).json({ success: false, message: 'Question string is required.' });
  }

  try {
    const answer = await askAI(question.trim());
    return res.json({
      success: true,
      question: question.trim(),
      answer: answer
    });
  } catch (error) {
    console.error('[AIController] Error handling query:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process AI query.'
    });
  }
}

module.exports = {
  handleAskAI
};

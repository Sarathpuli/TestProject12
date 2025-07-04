// routes/quiz.js
const express = require('express');
const router = express.Router();

// POST /api/quiz/generate - Generate quiz question
router.post('/generate', async (req, res) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a financial education expert. Generate quiz questions about investing, stocks, and personal finance. Return ONLY valid JSON.'
          },
          {
            role: 'user',
            content: `Generate a random stock market or investing quiz question. Return ONLY valid JSON in this exact format:
{
  "id": 1,
  "text": "What is a dividend?",
  "options": ["A payment made by companies to shareholders", "A type of stock price", "A trading fee", "A market index"],
  "answer": 0,
  "explanation": "A dividend is a payment made by companies to their shareholders, typically from profits."
}`
          }
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const quizContent = data.choices[0].message.content.trim();
    
    try {
      const quizQuestion = JSON.parse(quizContent);
      res.json(quizQuestion);
    } catch (parseError) {
      throw new Error('Invalid JSON response from AI');
    }

  } catch (error) {
    console.error('Quiz Generation Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate quiz',
      message: error.message 
    });
  }
});

module.exports = router;
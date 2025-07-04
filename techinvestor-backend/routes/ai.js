// routes/ai.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Rate limiting for AI endpoints (more restrictive)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per hour
  message: {
    error: 'Too many AI requests',
    message: 'You have exceeded the AI request limit. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/ai/ask - Handle AI questions
router.post('/ask', aiLimiter, async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // OpenAI API call (using newer format)
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
            content: 'You are a helpful financial education assistant. Provide accurate, beginner-friendly investment advice. Always include disclaimers about not being licensed financial advice.'
          },
          {
            role: 'user',
            content: `Context: ${context || 'General question'}\n\nQuestion: ${message}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    res.json({
      response: data.choices[0].message.content,
      usage: data.usage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI response',
      message: error.message 
    });
  }
});

module.exports = router;
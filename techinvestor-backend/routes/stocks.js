// routes/stocks.js
const express = require('express');
const router = express.Router();

// GET /api/stocks/search/:query - Search for stocks
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query || query.length < 1) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const response = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${process.env.FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();
    
    res.json({
      results: data.result || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stock Search Error:', error);
    res.status(500).json({ 
      error: 'Failed to search stocks',
      message: error.message 
    });
  }
});

// GET /api/stocks/quote/:symbol - Get stock quote
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Stock symbol is required' });
    }

    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${process.env.FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();
    
    res.json({
      symbol: symbol.toUpperCase(),
      quote: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stock Quote Error:', error);
    res.status(500).json({ 
      error: 'Failed to get stock quote',
      message: error.message 
    });
  }
});

module.exports = router;
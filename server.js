import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // Changed from 5173 to 5000

app.use(cors());
app.use(express.json());

// Check if API key exists
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment variables');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

console.log('✅ OpenAI client initialized');

app.post('/api/quiz', async (req, res) => {
  try {
    console.log('📝 Quiz request received');

    const userPrompt = `Generate a random stock market or investing quiz question. Return ONLY valid JSON in this exact format:
{
  "id": 1,
  "text": "What is a dividend?",
  "options": ["A payment made by companies to shareholders", "A type of stock price", "A trading fee", "A market index"],
  "answer": 0,
  "explanation": "A dividend is a payment made by companies to their shareholders, typically from profits."
}

Make sure:
- The question is about stocks, investing, finance, or markets
- Exactly 4 options in the array
- Answer is the index (0-3) of the correct option
- Explanation is clear and educational
- Return ONLY the JSON object, no markdown, no extra text`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a financial education expert. Return only valid JSON for quiz questions.'
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    console.log("\n🔍 Raw response from OpenAI:");
    console.log(responseText);

    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Clean the response - remove any markdown formatting
    let cleanedResponse = responseText;
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanedResponse);
      console.log("✅ Successfully parsed response");
      
      // Validate the structure
      if (!parsed.id || !parsed.text || !Array.isArray(parsed.options) || 
          parsed.options.length !== 4 || typeof parsed.answer !== 'number' || 
          !parsed.explanation) {
        throw new Error('Invalid question structure');
      }
      
      if (parsed.answer < 0 || parsed.answer > 3) {
        throw new Error('Invalid answer index');
      }
      
    } catch (err) {
      console.error("❌ JSON parsing error:", err.message);
      console.error("Raw response:", cleanedResponse);
      
      // Return a fallback question
      const fallbackQuestion = {
        id: Math.floor(Math.random() * 1000),
        text: "What does P/E ratio stand for?",
        options: [
          "Price to Earnings ratio",
          "Profit to Equity ratio", 
          "Price to Equity ratio",
          "Profit to Earnings ratio"
        ],
        answer: 0,
        explanation: "P/E ratio stands for Price-to-Earnings ratio, which compares a company's stock price to its earnings per share."
      };
      
      console.log("🔄 Using fallback question");
      return res.json(fallbackQuestion);
    }

    console.log("📤 Sending question to frontend");
    res.json(parsed);

  } catch (error) {
    console.error("🔥 Server error:", error.message);
    
    // Return a fallback question on any error
    const fallbackQuestion = {
      id: Math.floor(Math.random() * 1000),
      text: "What is diversification in investing?",
      options: [
        "Putting all money in one stock",
        "Spreading investments across different assets",
        "Only buying tech stocks", 
        "Trading frequently"
      ],
      answer: 1,
      explanation: "Diversification means spreading your investments across different types of assets to reduce risk."
    };
    
    res.json(fallbackQuestion);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Quiz server is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Quiz server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Quiz server shutting down...');
  process.exit(0);
});
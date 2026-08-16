const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Standard library name
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Unhandled error on ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({
    error: {
      message: 'Internal server error'
    }
  });
});

// Initialize Gemini with your API Key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/scan', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: { message: "Prompt is required" } });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: {
          message: "GEMINI_API_KEY is missing. Add it to your .env file before scanning."
        }
      });
    }

    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ text });
  } catch (error) {
    console.error("Error calling Gemini:", error);
    const message = error?.message || "Internal Server Error";
    res.status(500).json({
      error: {
        message: message.includes("not found") || message.includes("404")
          ? "The configured Gemini model is unavailable. Try a valid model such as gemini-2.0-flash."
          : message
      }
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Get a FREE Gemini API key at: https://aistudio.google.com/`);
});
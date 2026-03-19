const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Standard library name
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize Gemini with your API Key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/scan', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: { message: "Prompt is required" } });
    }

    // 1. Get the model
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // 2. Generate content (MUST use await)
    const result = await model.generateContent(prompt);

    // 3. Get the response object
    const response = await result.response;
    const text = response.text();

    // Return the response
    res.json({ text });
  } catch (error) {
    console.error("Error calling Gemini:", error);
    res.status(500).json({
      error: {
        message: error.message || "Internal Server Error"
      }
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Get a FREE Gemini API key at: https://aistudio.google.com/`);
});
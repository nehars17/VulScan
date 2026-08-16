const express = require('express');
const rateLimit = require('express-rate-limit');
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

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many requests. Please wait a minute before trying again.'
    }
  }
});

app.use('/api', apiLimiter);
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

// app.get('/api/models', async (req, res) => {
//   try {
//     if (!process.env.GEMINI_API_KEY) {
//       return res.status(500).json({
//         error: {
//           message: 'GEMINI_API_KEY is missing. Add it to your .env file before querying models.'
//         }
//       });
//     }

//     const response = await fetch(
//       `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`
//     );

//     const data = await response.json();

//     if (!response.ok) {
//       return res.status(response.status).json({
//         error: {
//           message: data?.error?.message || 'Failed to fetch available Gemini models.'
//         }
//       });
//     }

//     const models = (data.models || [])
//       .filter((model) => (model.supportedGenerationMethods || []).includes('generateContent'))
//       .map((model) => ({
//         name: model.name?.replace('models/', ''),
//         displayName: model.displayName,
//         description: model.description,
//         supportedGenerationMethods: model.supportedGenerationMethods || []
//       }))
//       .sort((a, b) => a.name.localeCompare(b.name));

//     res.json({ models });
//   } catch (error) {
//     console.error('Error fetching Gemini models:', error);
//     res.status(500).json({
//       error: {
//         message: error?.message || 'Internal Server Error'
//       }
//     });
//   }
// });

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
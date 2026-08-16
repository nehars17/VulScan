const express = require('express');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const maxPromptChars = Number(process.env.MAX_PROMPT_CHARS || 12000);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === 'production';

function requireApiKey(req, res, next) {
  const expectedApiKey = process.env.API_KEY;

  if (!expectedApiKey) {
    return next();
  }

  const providedApiKey = req.headers['x-api-key'] || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');

  if (providedApiKey !== expectedApiKey) {
    return res.status(401).json({
      error: {
        message: 'Unauthorized: valid API key required.'
      }
    });
  }

  return next();
}

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
app.use(express.json({ limit: '1mb' }));

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

app.use('/api', requireApiKey, apiLimiter);
app.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true, status: 'healthy' });
});
app.get('/readyz', (req, res) => {
  const isReady = !!process.env.GEMINI_API_KEY;
  return res.status(isReady ? 200 : 503).json({
    ok: isReady,
    status: isReady ? 'ready' : 'missing_gemini_api_key'
  });
});

app.use(express.static(path.join(__dirname)));

app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Unhandled error on ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({
    error: {
      message: 'Internal server error'
    }
  });
});

if (!process.env.GEMINI_API_KEY && isProduction) {
  console.error('Production environment requires GEMINI_API_KEY to be set.');
}

// Initialize Gemini with your API Key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/api/models', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: {
          message: 'GEMINI_API_KEY is missing. Add it to your .env file before querying models.'
        }
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: {
          message: data?.error?.message || 'Failed to fetch available Gemini models.'
        }
      });
    }

    const models = (data.models || [])
      .filter((model) => (model.supportedGenerationMethods || []).includes('generateContent'))
      .map((model) => ({
        name: model.name?.replace('models/', ''),
        displayName: model.displayName,
        description: model.description,
        supportedGenerationMethods: model.supportedGenerationMethods || []
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ models });
  } catch (error) {
    console.error('Error fetching Gemini models:', error);
    res.status(500).json({
      error: {
        message: error?.message || 'Internal Server Error'
      }
    });
  }
});

app.post('/api/scan', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: { message: 'Prompt is required' } });
    }

    if (prompt.length > maxPromptChars) {
      return res.status(413).json({
        error: {
          message: `Prompt is too large. Maximum allowed length is ${maxPromptChars} characters.`
        }
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: {
          message: 'GEMINI_API_KEY is missing. Add it to your .env file before scanning.'
        }
      });
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ text });
  } catch (error) {
    console.error('Error calling Gemini:', error);
    const message = error?.message || 'Internal Server Error';
    const isModelIssue = /not found|404|model.*unavailable|unsupported.*model/i.test(message);

    res.status(isModelIssue ? 400 : 500).json({
      error: {
        message: isModelIssue
          ? 'The configured Gemini model is unavailable. Try a valid model such as gemini-2.0-flash.'
          : 'AI scan failed. Please try again later.'
      }
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Get a FREE Gemini API key at: https://aistudio.google.com/`);
});
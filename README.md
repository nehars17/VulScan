# VulnScan

VulnScan is a lightweight web app for scanning source code with Google Gemini and returning structured security findings. It is designed to help developers inspect code for common vulnerabilities, identify OWASP-aligned issues, and compare vulnerable snippets with safer alternatives.

---

## What it does

- Accepts pasted code, uploaded files, or GitHub file URLs
- Sends code to Gemini for security analysis
- Returns a structured JSON result with summary, severity, category, location, and fix guidance
- Groups findings by categories such as injection, XSS, auth flaws, insecure config, and unsafe data handling
- Lets you query the Google Gemini model catalog for currently available model names
- Enforces basic API rate limiting to reduce abuse and accidental overuse

---

## Current stack

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js + Express
- AI provider: Google Gemini via the Google Generative AI SDK
- Security controls: CORS, request validation, API rate limiting

---

## Prerequisites

- Node.js 18 or newer
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/)

---

## Installation

```bash
git clone https://github.com/nehars17/VulScan.git
cd VulScan
npm install
```

---

## Configuration

Create a .env file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash
PORT=3000
```

Notes:

- GEMINI_API_KEY is required for scan requests and model lookups.
- GEMINI_MODEL can be set to any valid Gemini model you want to use.
- If you omit GEMINI_MODEL, the app defaults to gemini-2.0-flash.

---

## Run the app

```bash
node server.js
```

Then open:

http://localhost:3000

---

## API endpoints

### POST /api/scan

Sends a prompt payload and returns a security analysis JSON result.

Request body:

```json
{
  "prompt": "Your security analysis prompt or code-based prompt here"
}
```

Response:

```json
{
  "text": "...raw Gemini response text..."
}
```

### GET /api/models

Returns a list of Gemini models available to the active API key.

Example:

```bash
curl http://localhost:3000/api/models
```

Response:

```json
{
  "models": [
    {
      "name": "gemini-2.0-flash",
      "displayName": "Gemini 2.0 Flash",
      "description": "Fast model for general generation",
      "supportedGenerationMethods": ["generateContent"]
    }
  ]
}
```

---

## Rate limiting

The API applies a basic per-IP rate limit:

- 20 requests per minute
- 429 response if the limit is exceeded

This helps prevent excessive Gemini usage and reduces the risk of accidental API spamming.

---

## Limitations

- It is not a substitute for a full security review or formal penetration testing.
- LLM output can be inconsistent, especially for large or ambiguous code samples.
- GitHub scanning is best suited to single-file public resources and is not a repository-wide scanner.
- Response quality depends on the prompt, model, and API access level.

---

## Roadmap

- [ ] Add richer UI for model selection
- [ ] Improve multi-file and project-level scanning
- [ ] Add result export options
- [ ] Add user-friendly scan history
- [ ] Support additional AI providers

---

## Disclaimer

This project is intended for educational, research, and internal security assessment use. It should be paired with manual review and standard engineering security practices.

---

## License

ISC License

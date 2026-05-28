# VulnScan — LLM-Powered Code Security Analyser

VulnScan is a web-based SAST tool that uses large language models to perform semantic analysis of source code. Unlike pattern-matching scanners, it understands code logic and intent — catching vulnerability classes that regex-based tools miss.

Built as a solo project. Supports any programming language.

![VulnScan demo screenshot](docs/screenshot.png)
<!-- Replace with an actual screenshot or GIF when available -->

---

## What it does

- Accepts code via direct paste, file upload, or individual GitHub file URLs
- Analyses code semantically using Google Gemini, going beyond surface-level pattern matching
- Maps findings to OWASP Top 10 categories with vulnerability descriptions and affected line references
- Produces side-by-side "Vulnerable vs. Fixed" code comparisons for each finding
- Exports full scan reports as JSON for further analysis or integration

---

## Getting started

### Prerequisites

- Node.js 18+
- A free Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Installation

```bash
git clone https://github.com/nehars17/VulScan.git
cd VulScan
npm install
```

### Configuration

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### Running

```bash
node server.js
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| AI engine | Google Gemini API (`@google/generative-ai`) |

---

## Limitations

- GitHub URL scanning supports individual files only, not full repositories
- LLM-based analysis is non-deterministic — results may vary between scans of the same input
- Not intended as a replacement for manual code review or professional penetration testing
- Requires a Gemini API key to run (free tier available)

---

## Roadmap

- [ ] Full GitHub repository scanning
- [ ] Demo mode without API key requirement
- [ ] Support for additional LLM backends
- [ ] CI/CD integration via CLI

---

## Disclaimer

VulnScan is built for educational and research purposes. Use it as one layer of a broader security review process, not as a standalone audit tool.

---

## License

ISC License

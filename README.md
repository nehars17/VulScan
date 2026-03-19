# 🛡️ VulnScan — LLM-Powered Code Security Analyzer

VulnScan is a modern, web-based security tool that leverages Large Language Models (LLMs) to perform deep semantic analysis of source code. It detects potential vulnerabilities, including OWASP Top 10 issues, and provides actionable fix suggestions.

## ✨ Features

-   **Multi-Source Input**: Paste code directly, upload source files, or provide GitHub repository URLs.
-   **Deep Semantic Analysis**: Goes beyond pattern matching by using LLMs to understand code logic and intent.
-   **OWASP Mapping**: Automatically categorizes findings according to OWASP standards.
-   **Interactive Reports**: View detailed vulnerability descriptions, locations, and side-by-side "Vulnerable vs. Fixed" code comparisons.
-   **Exportable Results**: Download your scan report as a JSON file for further analysis.

## 🚀 Getting Started

### Prerequisites

-   **Node.js**: Version 18 or higher recommended.
-   **Gemini API Key**: A free API key from [Google AI Studio](https://aistudio.google.com/).

### Installation

1.  **Clone or download the project files.**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
    Create a `.env` file in the root directory (one is provided as a template) and add your API key:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    PORT=3000
    ```

### Running the Application

1.  **Start the server**:
    ```bash
    node server.js
    ```
2.  **Access the web interface**:
    Open [http://localhost:3000](http://localhost:3000) in your web browser.

## 🛠️ Technology Stack

-   **Frontend**: Vanilla HTML5, CSS3 (with custom animations), and modern JavaScript.
-   **Animations**: Syne & JetBrains Mono typography with advanced CSS glow effects and micro-animations.
-   **Backend**: Node.js and Express.js.
-   **AI Engine**: Google Gemini API via the `@google/generative-ai` SDK.

## ⚠️ Disclaimer

VulnScan is designed for **educational and research purposes only**. While it uses advanced AI, it should not be the sole method of security verification. Always pair automated scans with manual code review and professional security testing.

## 📋 License

ISC License. Feel free to use and modify for personal or educational projects.

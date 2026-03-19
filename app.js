// ── State ──────────────────────────────────────────────────────────────────
let currentTab = 'paste';
let uploadedFileContent = '';
let ghOption = 'single';
let lastResults = null;

// ── Tab switching ───────────────────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('pane-' + tab).classList.add('active');
  currentTab = tab;
  hideError();
}

// ── GitHub scope option ─────────────────────────────────────────────────────
function selectGhOption(opt) {
  ghOption = opt;
  document.querySelectorAll('.github-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('opt-' + opt).classList.add('selected');
  document.getElementById('multiFileNote').style.display = opt === 'multi' ? 'block' : 'none';
}

// ── File upload ─────────────────────────────────────────────────────────────
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('selectedFileName').textContent = '✓ ' + file.name;
  const reader = new FileReader();
  reader.onload = ev => { uploadedFileContent = ev.target.result; };
  reader.readAsText(file);
}

// Drag & drop
document.addEventListener('DOMContentLoaded', () => {
  const zone = document.getElementById('uploadZone');
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
      document.getElementById('selectedFileName').textContent = '✓ ' + file.name;
      const reader = new FileReader();
      reader.onload = ev => { uploadedFileContent = ev.target.result; };
      reader.readAsText(file);
    }
  });
});

// ── Error helpers ───────────────────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = '⚠ ' + msg;
  el.classList.add('active');
}

function hideError() {
  document.getElementById('errorMsg').classList.remove('active');
}

// ── GitHub raw fetch ────────────────────────────────────────────────────────
async function fetchGitHubFile(url) {
  const rawUrl = url
    .replace('https://github.com/', 'https://raw.githubusercontent.com/')
    .replace('/blob/', '/');
  const resp = await fetch(rawUrl);
  if (!resp.ok) throw new Error("Could not fetch GitHub file. Make sure it's a public repo and valid file URL.");
  return await resp.text();
}

// ── Gather code from active input ───────────────────────────────────────────
async function getCodeToScan() {
  if (currentTab === 'paste') {
    const code = document.getElementById('codeInput').value.trim();
    if (!code) throw new Error('Please paste some code to scan.');
    return { code, source: 'pasted code' };
  }
  if (currentTab === 'file') {
    if (!uploadedFileContent) throw new Error('Please upload a file first.');
    return { code: uploadedFileContent, source: 'uploaded file' };
  }
  if (currentTab === 'github') {
    const urls = document.getElementById('githubUrl').value.trim()
      .split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
    if (!urls.length) throw new Error('Please enter a GitHub URL.');
    const codes = await Promise.all(urls.map(fetchGitHubFile));
    return { code: codes.join('\n\n// --- next file ---\n\n'), source: urls[0] };
  }
}

// ── Loading step animation ──────────────────────────────────────────────────
async function animateLoadingSteps() {
  const steps = [
    { dot: 'step1dot', text: 'step1text' },
    { dot: 'step2dot', text: 'step2text' },
    { dot: 'step3dot', text: 'step3text' },
    { dot: 'step4dot', text: 'step4text' },
  ];
  for (let i = 0; i < steps.length; i++) {
    await new Promise(r => setTimeout(r, 600));
    document.getElementById(steps[i].dot).classList.remove('pending');
    document.getElementById(steps[i].text).style.color = 'var(--text)';
  }
}

// ── Build prompt ────────────────────────────────────────────────────────────
function buildPrompt(code, lang) {
  const langHint = lang !== 'auto' ? ` The code is written in ${lang}.` : '';
  return `You are a senior application security engineer and penetration tester. Analyze the following code for security vulnerabilities.${langHint}

Return ONLY a JSON object (no markdown, no backticks, no preamble) in this exact format:
{
  "summary": "One sentence overview of what the code does and overall security posture",
  "language": "detected language",
  "vulnerabilities": [
    {
      "id": "VULN-001",
      "title": "Short descriptive title",
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
      "category": "e.g. SQL Injection, XSS, Broken Auth, IDOR, etc.",
      "owasp": "e.g. A03:2021 – Injection",
      "description": "Clear explanation of the vulnerability, why it is dangerous, and what an attacker could do",
      "location": "Function name, line number hint, or code snippet reference",
      "vulnerable_code": "The exact vulnerable code snippet (short, 1-4 lines)",
      "fix_code": "The corrected/safe version of the same code",
      "fix_explanation": "Step-by-step explanation of how to fix it"
    }
  ]
}

If no vulnerabilities are found, return an empty vulnerabilities array.
Detect issues including but not limited to: SQL injection, XSS, command injection, path traversal,
insecure deserialization, broken authentication, hardcoded credentials, SSRF, XXE, insecure direct
object references, missing input validation, weak cryptography, race conditions, and misconfigurations.

Code to analyze:
\`\`\`
${code.slice(0, 12000)}
\`\`\``;
}

// ── Main scan ───────────────────────────────────────────────────────────────
async function runScan() {
  hideError();

  let codeData;
  try {
    codeData = await getCodeToScan();
  } catch (e) {
    showError(e.message);
    return;
  }

  // Switch to loading state
  document.getElementById('inputPanel').style.display = 'none';
  document.getElementById('loadingPanel').classList.add('active');
  document.getElementById('resultsPanel').classList.remove('active');
  document.getElementById('scanBtn').disabled = true;

  animateLoadingSteps();

  const lang = document.getElementById('langSelect').value;

  try {
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: buildPrompt(codeData.code, lang)
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'API error');

    const rawText = data.text || '';
    const clean = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    lastResults = { ...parsed, source: codeData.source, scannedAt: new Date().toISOString() };
    renderResults(lastResults);

  } catch (e) {
    document.getElementById('inputPanel').style.display = 'block';
    document.getElementById('loadingPanel').classList.remove('active');
    document.getElementById('scanBtn').disabled = false;
    showError('Scan failed: ' + e.message);
  }
}

// ── Render results ──────────────────────────────────────────────────────────
function renderResults(data) {
  document.getElementById('loadingPanel').classList.remove('active');
  document.getElementById('resultsPanel').classList.add('active');

  // Meta line
  const time = new Date(data.scannedAt).toLocaleString();
  document.getElementById('resultsMeta').textContent =
    `${data.language || 'Unknown language'} · ${data.vulnerabilities.length} issue${data.vulnerabilities.length !== 1 ? 's' : ''} found · ${time}`;

  // Summary cards
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  data.vulnerabilities.forEach(v => { if (counts[v.severity] !== undefined) counts[v.severity]++; });

  document.getElementById('summaryCards').innerHTML = `
    <div class="summary-card critical"><div class="summary-count">${counts.CRITICAL}</div><div class="summary-label">Critical</div></div>
    <div class="summary-card high"><div class="summary-count">${counts.HIGH}</div><div class="summary-label">High</div></div>
    <div class="summary-card medium"><div class="summary-count">${counts.MEDIUM}</div><div class="summary-label">Medium</div></div>
    <div class="summary-card low"><div class="summary-count">${counts.LOW}</div><div class="summary-label">Low</div></div>
  `;

  const listEl = document.getElementById('vulnList');

  if (!data.vulnerabilities.length) {
    listEl.innerHTML = `
      <div class="all-clear">
        <div class="all-clear-icon">✅</div>
        <h3>No vulnerabilities detected</h3>
        <p>${data.summary || 'The code appears clean. Always pair automated scanning with manual review.'}</p>
      </div>`;
    return;
  }

  const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
  const sorted = [...data.vulnerabilities].sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));

  listEl.innerHTML = sorted.map((v, i) => `
    <div class="vuln-card" style="animation-delay: ${i * 0.07}s" id="vuln-${i}">
      <div class="vuln-header" onclick="toggleVuln(${i})">
        <span class="severity-badge ${v.severity}">${v.severity}</span>
        <span class="vuln-title">${escHtml(v.title)}</span>
        <span class="vuln-category">${escHtml(v.category)}</span>
        <span class="vuln-toggle">▼</span>
      </div>
      <div class="vuln-body">
        <div class="vuln-section">
          <div class="vuln-section-title">📍 Location</div>
          <p>${escHtml(v.location || 'See code snippets below')}</p>
        </div>
        <div class="vuln-section">
          <div class="vuln-section-title">🔎 Description</div>
          <p>${escHtml(v.description)}</p>
        </div>
        ${v.vulnerable_code ? `
        <div class="vuln-section">
          <div class="vuln-section-title">💀 Vulnerable Code</div>
          <div class="fix-tag vulnerable">VULNERABLE</div>
          <div class="code-block bad">${escHtml(v.vulnerable_code)}</div>
        </div>` : ''}
        ${v.fix_code ? `
        <div class="vuln-section">
          <div class="vuln-section-title">🛠 Fixed Code</div>
          <div class="fix-tag fixed">FIXED</div>
          <div class="code-block good">${escHtml(v.fix_code)}</div>
        </div>` : ''}
        <div class="vuln-section">
          <div class="vuln-section-title">✅ How to Fix</div>
          <p>${escHtml(v.fix_explanation)}</p>
        </div>
        ${v.owasp ? `<div class="owasp-ref">📋 ${escHtml(v.owasp)}</div>` : ''}
      </div>
    </div>
  `).join('');
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function toggleVuln(i) {
  document.getElementById('vuln-' + i).classList.toggle('open');
}

function resetScan() {
  document.getElementById('resultsPanel').classList.remove('active');
  document.getElementById('inputPanel').style.display = 'block';
  document.getElementById('scanBtn').disabled = false;

  ['step1dot','step2dot','step3dot','step4dot'].forEach((id, i) => {
    const el = document.getElementById(id);
    el.classList.toggle('pending', i > 0);
  });
  ['step1text','step2text','step3text','step4text'].forEach((id, i) => {
    document.getElementById(id).style.color = i === 0 ? '' : 'var(--muted)';
  });
}

function exportJSON() {
  if (!lastResults) return;
  const blob = new Blob([JSON.stringify(lastResults, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'vulnscan-report.json';
  a.click();
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

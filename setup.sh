#!/bin/bash
# =============================================================================
# PageLens — AI Website Audit Tool
# Run this script once to generate the full project structure + all files.
# Usage: bash setup.sh
# =============================================================================

set -e  # exit on any error

PROJECT="ai-website-audit"

echo ""
echo "🔨  Creating PageLens project..."
echo ""

# ── Create directory structure ─────────────────────────────────────────────────
mkdir -p $PROJECT/{logs,client/src/components,server/{scraper,ai,routes,utils}}

# ==============================================================================
# ROOT FILES
# ==============================================================================

cat > $PROJECT/.gitignore << 'EOF'
node_modules/
.env
dist/
.DS_Store
*.log
EOF

cat > $PROJECT/package.json << 'EOF'
{
  "name": "ai-website-audit",
  "version": "1.0.0",
  "description": "AI-powered website audit tool",
  "private": true,
  "scripts": {
    "install:all": "cd server && npm install && cd ../client && npm install",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "build:client": "cd client && npm run build"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

cat > $PROJECT/README.md << 'EOF'
# PageLens — AI Website Audit Tool

## Quick Start

### 1. Install dependencies
```bash
cd server && npm install && cd ../client && npm install
```

### 2. Configure environment
```bash
cd server
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 3. Run (two terminals)
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Open http://localhost:5173
EOF

# ==============================================================================
# LOGS
# ==============================================================================

cat > $PROJECT/logs/promptLogs.json << 'EOF'
[]
EOF

# ==============================================================================
# SERVER FILES
# ==============================================================================

cat > $PROJECT/server/package.json << 'EOF'
{
  "name": "ai-website-audit-server",
  "version": "1.0.0",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "axios": "^1.7.7",
    "cheerio": "^1.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.1",
    "express-rate-limit": "^7.4.1"
  }
}
EOF

cat > $PROJECT/server/.env.example << 'EOF'
# Copy this file to .env and fill in your values
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
NODE_ENV=development
EOF

cat > $PROJECT/server/server.js << 'EOF'
// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import auditRouter from "./routes/audit.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:4173"] }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests. Please wait before auditing again." },
});
app.use("/api", limiter);

app.use("/api", auditRouter);

app.use((_req, res) => res.status(404).json({ error: "Route not found." }));

app.use((err, _req, res, _next) => {
  console.error("[Server Error]", err);
  res.status(500).json({ error: err.message || "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`✅  Audit server running → http://localhost:${PORT}`);
});
EOF

cat > $PROJECT/server/utils/parser.js << 'EOF'
// server/utils/parser.js

export function validateUrl(raw) {
  if (!raw || typeof raw !== "string") return { valid: false, reason: "URL is required." };
  let normalized = raw.trim();
  if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;
  try {
    const parsed = new URL(normalized);
    if (!["http:", "https:"].includes(parsed.protocol))
      return { valid: false, reason: "Only http and https URLs are supported." };
    if (!parsed.hostname || !parsed.hostname.includes("."))
      return { valid: false, reason: "URL must have a valid hostname." };
    return { valid: true, url: normalized };
  } catch {
    return { valid: false, reason: "Invalid URL format." };
  }
}

export function getOrigin(urlStr) {
  try { return new URL(urlStr).origin; } catch { return null; }
}

export function truncateWords(text, maxWords = 1000) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "…";
}

export function countWords(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export function calculateSeoScore(metrics) {
  const checks = [
    { pass: !!metrics.metaTitle, weight: 15 },
    { pass: metrics.metaTitle && metrics.metaTitle.length >= 30 && metrics.metaTitle.length <= 60, weight: 5 },
    { pass: !!metrics.metaDescription, weight: 15 },
    { pass: metrics.metaDescription && metrics.metaDescription.length >= 120 && metrics.metaDescription.length <= 160, weight: 5 },
    { pass: metrics.headings.h1 === 1, weight: 15 },
    { pass: metrics.headings.h2 > 0, weight: 10 },
    { pass: metrics.headings.h3 > 0, weight: 5 },
    { pass: metrics.images.missingAltPercent === 0, weight: 10 },
    { pass: metrics.wordCount >= 300, weight: 10 },
    { pass: metrics.wordCount >= 700, weight: 5 },
    { pass: metrics.ctaCount > 0, weight: 5 },
  ];
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce((sum, c) => sum + (c.pass ? c.weight : 0), 0);
  return Math.round((earned / totalWeight) * 100);
}
EOF

cat > $PROJECT/server/scraper/scraper.js << 'EOF'
// server/scraper/scraper.js
// SCRAPER LAYER — deterministic only. Zero AI.

import axios from "axios";
import * as cheerio from "cheerio";
import { getOrigin, countWords, truncateWords } from "../utils/parser.js";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_CONTENT_WORDS = 1000;

const CTA_TEXT_PATTERN =
  /\b(get started|start free|try free|sign up|sign-up|signup|register|buy now|shop now|order now|contact us|get a quote|request demo|book a demo|schedule|learn more|see pricing|view plans|download|subscribe|join now|apply now|free trial|get access|claim|unlock)\b/i;

export async function scrapePage(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const origin = getOrigin(url);

  const metaTitle =
    $("title").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    null;

  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;

  const headings = { h1: $("h1").length, h2: $("h2").length, h3: $("h3").length };

  const $body = $("body").clone();
  $body.find("script, style, noscript, iframe, svg, [aria-hidden='true']").remove();
  const bodyText = $body.text().replace(/\s+/g, " ").trim();
  const wordCount = countWords(bodyText);

  let internalLinks = 0;
  let externalLinks = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    let absolute;
    try { absolute = new URL(href, url).href; } catch { return; }
    getOrigin(absolute) === origin ? internalLinks++ : externalLinks++;
  });

  const $images = $("img");
  const totalImages = $images.length;
  let missingAlt = 0;
  $images.each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt === null || alt.trim() === "") missingAlt++;
  });
  const missingAltPercent = totalImages > 0 ? Math.round((missingAlt / totalImages) * 100) : 0;

  let ctaCount = 0;
  const ctaElements = [];

  $("button").each((_, el) => {
    const text = $(el).text().trim();
    if (text) { ctaCount++; ctaElements.push({ type: "button", text: text.substring(0, 60) }); }
  });

  $('a[role="button"], a.btn, a[class*="button"], a[class*="btn"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) { ctaCount++; ctaElements.push({ type: "link-button", text: text.substring(0, 60) }); }
  });

  $("a[href]").each((_, el) => {
    const $el = $(el);
    if ($el.attr("role") === "button" || /\bbtn\b|\bbutton\b/i.test($el.attr("class") || "")) return;
    const text = $el.text().trim();
    if (text && CTA_TEXT_PATTERN.test(text)) { ctaCount++; ctaElements.push({ type: "action-link", text: text.substring(0, 60) }); }
  });

  const pageContent = truncateWords(bodyText, MAX_CONTENT_WORDS);

  const metrics = {
    url, metaTitle, metaDescription, wordCount, headings,
    links: { internal: internalLinks, external: externalLinks },
    images: { total: totalImages, missingAlt, missingAltPercent },
    ctaCount,
    ctaElements: ctaElements.slice(0, 10),
  };

  return { metrics, pageContent };
}

async function fetchHtml(url) {
  try {
    const response = await axios.get(url, {
      timeout: FETCH_TIMEOUT_MS,
      maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WebAuditBot/1.0)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      validateStatus: (status) => status < 400,
    });
    const contentType = response.headers["content-type"] || "";
    if (!contentType.includes("text/html")) throw new Error(`URL returned non-HTML content: ${contentType}`);
    return response.data;
  } catch (err) {
    if (err.code === "ECONNREFUSED") throw new Error("Connection refused. Check the URL.");
    if (err.code === "ETIMEDOUT" || err.code === "ECONNABORTED") throw new Error("Request timed out.");
    if (err.response?.status === 403) throw new Error("Access denied (403). The page blocks automated requests.");
    if (err.response?.status === 404) throw new Error("Page not found (404).");
    throw new Error(err.message || "Failed to fetch the page.");
  }
}
EOF

cat > $PROJECT/server/ai/prompt.js << 'EOF'
// server/ai/prompt.js

export const SYSTEM_PROMPT = `You are a senior SEO and UX analyst at a digital marketing agency specializing in high-performing marketing websites.

Analyze the provided webpage metrics and content excerpt.

RULES (follow strictly):
- Ground EVERY insight in the specific numbers provided in the metrics JSON
- Reference explicit figures (e.g., "With only 2 H2s across 1,400 words...")
- Avoid generic advice — every statement must relate to this specific page
- Be specific, actionable, and concise
- Do NOT hallucinate or invent data not present in the input
- Do NOT produce placeholder text or filler phrases like "consider improving..."
- Output STRICT JSON only — no markdown fences, no preamble, no explanation outside JSON

OUTPUT FORMAT (return this exact shape, nothing else):
{
  "insights": {
    "seo": "string — SEO structure analysis referencing specific metrics",
    "messaging": "string — clarity and value proposition assessment",
    "cta": "string — CTA count/placement/effectiveness analysis",
    "contentDepth": "string — content volume and depth analysis",
    "ux": "string — structural/UX concerns based on page data"
  },
  "recommendations": [
    {
      "priority": 1,
      "issue": "short issue title",
      "reason": "why this matters, tied to specific metrics",
      "action": "concrete next step"
    }
  ]
}

Produce 3 to 5 recommendations, ordered by priority (1 = most impactful).`;

export function buildUserPrompt({ metrics, pageContent, seoScore }) {
  return `## WEBPAGE METRICS (extracted deterministically — treat as ground truth)

\`\`\`json
${JSON.stringify(metrics, null, 2)}
\`\`\`

Calculated SEO Score: ${seoScore}/100

## PAGE CONTENT EXCERPT (first ~1000 words of visible body text)

${pageContent}

---

Based on the above metrics and content, produce the structured JSON analysis.`;
}

export function buildPromptLog({ metrics, pageContent, seoScore, rawResponse }) {
  return {
    timestamp: new Date().toISOString(),
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt({ metrics, pageContent, seoScore }),
    inputData: {
      metrics,
      seoScore,
      pageContentWordCount: pageContent.split(/\s+/).length,
      pageContentSnippet: pageContent.substring(0, 200) + "…",
    },
    rawAiResponse: rawResponse,
  };
}
EOF

cat > $PROJECT/server/ai/gemini.js << 'EOF'
// server/ai/gemini.js
// AI LAYER — structured input → structured JSON output. Gemini first, OpenAI fallback.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt.js";

const GEMINI_MODEL = "gemini-1.5-flash";

export async function runAiAnalysis({ metrics, pageContent, seoScore }) {
  const userPrompt = buildUserPrompt({ metrics, pageContent, seoScore });

  if (process.env.GEMINI_API_KEY) {
    try { return await callGemini(userPrompt); }
    catch (err) { console.warn("[AI] Gemini failed, trying OpenAI:", err.message); }
  }

  if (process.env.OPENAI_API_KEY) {
    try { return await callOpenAI(userPrompt); }
    catch (err) { throw new Error("Both AI providers failed. Check API keys and quotas."); }
  }

  throw new Error("No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY in .env");
}

async function callGemini(userPrompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.9,
      maxOutputTokens: 1500,
      responseMimeType: "application/json",
    },
  });
  const result = await model.generateContent(userPrompt);
  const raw = result.response.text();
  const parsed = safeParseJson(raw);
  validateAiOutput(parsed);
  return { parsed, raw, provider: "gemini" };
}

async function callOpenAI(userPrompt) {
  const { default: OpenAI } = await import("openai").catch(() => {
    throw new Error("openai package not installed. Run: npm install openai");
  });
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 1500,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });
  const raw = completion.choices[0].message.content;
  const parsed = safeParseJson(raw);
  validateAiOutput(parsed);
  return { parsed, raw, provider: "openai" };
}

function safeParseJson(text) {
  if (!text) throw new Error("AI returned empty response.");
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) { try { return JSON.parse(match[0]); } catch {} }
    throw new Error(`AI response was not valid JSON. Raw: ${cleaned.substring(0, 200)}`);
  }
}

function validateAiOutput(parsed) {
  if (!parsed || typeof parsed !== "object") throw new Error("AI output is not a JSON object.");
  if (!parsed.insights || typeof parsed.insights !== "object") throw new Error("AI output missing 'insights'.");
  if (!Array.isArray(parsed.recommendations)) throw new Error("AI output missing 'recommendations'.");
  for (const key of ["seo", "messaging", "cta", "contentDepth", "ux"]) {
    if (typeof parsed.insights[key] !== "string") throw new Error(`AI output missing insights.${key}`);
  }
}
EOF

cat > $PROJECT/server/ai/logger.js << 'EOF'
// server/ai/logger.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_PATH = path.resolve(__dirname, "../../logs/promptLogs.json");

export async function appendPromptLog(entry) {
  let existing = [];
  try {
    const raw = await fs.readFile(LOG_PATH, "utf-8");
    existing = JSON.parse(raw);
    if (!Array.isArray(existing)) existing = [];
  } catch {}
  existing.push(entry);
  if (existing.length > 50) existing = existing.slice(-50);
  await fs.writeFile(LOG_PATH, JSON.stringify(existing, null, 2), "utf-8");
}
EOF

cat > $PROJECT/server/routes/audit.js << 'EOF'
// server/routes/audit.js
import { Router } from "express";
import { scrapePage } from "../scraper/scraper.js";
import { runAiAnalysis } from "../ai/gemini.js";
import { buildPromptLog } from "../ai/prompt.js";
import { appendPromptLog } from "../ai/logger.js";
import { validateUrl, calculateSeoScore } from "../utils/parser.js";

const router = Router();

router.post("/audit", async (req, res, next) => {
  try {
    const { url: rawUrl } = req.body;

    const { valid, url, reason } = validateUrl(rawUrl);
    if (!valid) return res.status(400).json({ error: reason });

    console.log(`[Audit] Starting → ${url}`);

    let metrics, pageContent;
    try {
      ({ metrics, pageContent } = await scrapePage(url));
    } catch (err) {
      return res.status(422).json({ error: `Scraping failed: ${err.message}` });
    }

    const seoScore = calculateSeoScore(metrics);

    let parsed, rawResponse, provider;
    try {
      ({ parsed, raw: rawResponse, provider } = await runAiAnalysis({ metrics, pageContent, seoScore }));
    } catch (err) {
      return res.status(502).json({ error: `AI analysis failed: ${err.message}` });
    }

    const logEntry = buildPromptLog({ metrics, pageContent, seoScore, rawResponse });
    appendPromptLog({ ...logEntry, provider }).catch((err) =>
      console.warn("[Logger] Failed to write log:", err.message)
    );

    return res.json({
      url, metrics, seoScore,
      insights: parsed.insights,
      recommendations: parsed.recommendations,
      provider,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    aiProvider: process.env.GEMINI_API_KEY ? "gemini" : process.env.OPENAI_API_KEY ? "openai" : "none",
  });
});

export default router;
EOF

# ==============================================================================
# CLIENT FILES
# ==============================================================================

cat > $PROJECT/client/package.json << 'EOF'
{
  "name": "ai-website-audit-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "vite": "^5.4.10"
  }
}
EOF

cat > $PROJECT/client/vite.config.js << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
});
EOF

cat > $PROJECT/client/tailwind.config.js << 'EOF'
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'DM Serif Display'", "Georgia", "serif"],
        body: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        ink: { DEFAULT: "#0d0d0d", soft: "#1a1a1a", muted: "#2e2e2e" },
        paper: { DEFAULT: "#f9f6f0", warm: "#f2ede3", mid: "#e8e0d0" },
        amber: { audit: "#e8a000", light: "#ffc94a", pale: "#fff4d6" },
        signal: {
          green: "#1a7a4a", greenLight: "#d1f2e1",
          red: "#b91c1c", redLight: "#fee2e2",
          yellow: "#b45309", yellowLight: "#fef3c7",
        },
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
        "card-hover": "0 8px 28px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
        inner: "inset 0 1px 3px rgba(0,0,0,0.08)",
      },
      borderRadius: { "2.5xl": "1.125rem" },
    },
  },
  plugins: [],
};
EOF

cat > $PROJECT/client/postcss.config.js << 'EOF'
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
EOF

cat > $PROJECT/client/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PageLens — AI Website Audit Tool</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

cat > $PROJECT/client/src/main.jsx << 'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
EOF

cat > $PROJECT/client/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body { @apply bg-paper text-ink font-body antialiased; }
}

@layer components {
  .section-card { @apply bg-white rounded-2.5xl shadow-card border border-paper-mid p-6 md:p-8; }
  .badge-green { @apply inline-flex items-center gap-1 bg-signal-greenLight text-signal-green text-xs font-semibold px-2 py-0.5 rounded-full; }
  .badge-red { @apply inline-flex items-center gap-1 bg-signal-redLight text-signal-red text-xs font-semibold px-2 py-0.5 rounded-full; }
  .badge-yellow { @apply inline-flex items-center gap-1 bg-signal-yellowLight text-signal-yellow text-xs font-semibold px-2 py-0.5 rounded-full; }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-up { animation: fadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
.animate-fade-up-1 { animation-delay: 0ms; }
.animate-fade-up-2 { animation-delay: 80ms; }
.animate-fade-up-3 { animation-delay: 160ms; }

@keyframes blink {
  0%, 80%, 100% { opacity: 0.15; }
  40% { opacity: 1; }
}
.loading-dot { animation: blink 1.4s infinite ease-in-out; }
.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }
EOF

cat > $PROJECT/client/src/components/UrlForm.jsx << 'EOF'
import React, { useState } from "react";

export default function UrlForm({ onSubmit, isLoading }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const trimmed = url.trim();
    if (!trimmed) { setError("Please enter a URL."); return; }
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </span>
          <input
            type="text" value={url} onChange={(e) => { setUrl(e.target.value); if (error) setError(""); }}
            placeholder="https://example.com" disabled={isLoading}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-paper-mid rounded-xl text-ink placeholder-ink/30 font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-audit/40 focus:border-amber-audit transition-all shadow-inner disabled:opacity-60"
          />
        </div>
        <button type="submit" disabled={isLoading}
          className="flex items-center justify-center gap-2 px-7 py-3.5 bg-ink text-paper rounded-xl font-body font-semibold text-sm hover:bg-ink-soft active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap">
          {isLoading ? (
            <><span className="flex gap-1">
              <span className="loading-dot w-1.5 h-1.5 rounded-full bg-paper-warm inline-block"/>
              <span className="loading-dot w-1.5 h-1.5 rounded-full bg-paper-warm inline-block"/>
              <span className="loading-dot w-1.5 h-1.5 rounded-full bg-paper-warm inline-block"/>
            </span>Auditing…</>
          ) : <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>Audit Page</>}
        </button>
      </div>
      {error && <p className="mt-2 text-signal-red text-xs font-medium pl-1">{error}</p>}
    </form>
  );
}
EOF

cat > $PROJECT/client/src/components/Metrics.jsx << 'EOF'
import React from "react";

function ScoreRing({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#1a7a4a" : score >= 50 ? "#b45309" : "#b91c1c";
  const label = score >= 75 ? "Good" : score >= 50 ? "Needs Work" : "Poor";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e8e0d0" strokeWidth="10"/>
          <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl text-ink leading-none">{score}</span>
          <span className="text-[10px] font-body font-medium text-ink/50 uppercase tracking-widest mt-0.5">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
        style={{ color, backgroundColor: color + "18" }}>{label}</span>
    </div>
  );
}

function MetricCard({ icon, label, value, sub, status }) {
  const statusClasses = {
    good: "border-signal-green/20 bg-signal-greenLight/30",
    warn: "border-signal-yellow/20 bg-signal-yellowLight/30",
    bad: "border-signal-red/20 bg-signal-redLight/30",
    neutral: "border-paper-mid bg-paper/60",
  };
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 hover:shadow-card transition-shadow ${statusClasses[status || "neutral"]}`}>
      <div className="flex items-center gap-2 text-ink/50">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-body font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-display text-2xl text-ink leading-tight">{value}</div>
      {sub && <div className="text-xs font-body text-ink/50">{sub}</div>}
    </div>
  );
}

function MetaRow({ label, value }) {
  const len = value ? value.length : 0;
  const isEmpty = !value;
  const lenStatus = label === "Meta Title"
    ? (len >= 30 && len <= 60 ? "good" : len > 0 ? "warn" : "bad")
    : (len >= 120 && len <= 160 ? "good" : len > 0 ? "warn" : "bad");
  return (
    <div className="flex flex-col gap-1.5 py-3 border-b border-paper-mid last:border-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-body font-semibold uppercase tracking-wider text-ink/50">{label}</span>
        {isEmpty ? <span className="badge-red">Missing</span>
          : <span className={lenStatus === "good" ? "badge-green" : "badge-yellow"}>{len} chars</span>}
      </div>
      {isEmpty
        ? <p className="text-sm font-body text-ink/30 italic">Not found</p>
        : <p className="text-sm font-body text-ink leading-relaxed">{value}</p>}
    </div>
  );
}

export default function Metrics({ metrics, seoScore }) {
  const { wordCount, headings, links, images, ctaCount, metaTitle, metaDescription, url } = metrics;
  return (
    <div className="section-card animate-fade-up animate-fade-up-1">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl text-ink">Page Metrics</h2>
          <p className="text-xs font-body text-ink/40 mt-1 font-mono truncate max-w-xs">{url}</p>
        </div>
        <ScoreRing score={seoScore} />
      </div>
      <div className="bg-paper rounded-xl p-4 mb-6">
        <h3 className="text-xs font-body font-semibold uppercase tracking-widest text-ink/40 mb-3">Meta Tags</h3>
        <MetaRow label="Meta Title" value={metaTitle} />
        <MetaRow label="Meta Description" value={metaDescription} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon="📝" label="Word Count" value={wordCount.toLocaleString()}
          sub={wordCount < 300 ? "Too thin" : wordCount < 700 ? "Moderate" : "Substantial"}
          status={wordCount >= 700 ? "good" : wordCount >= 300 ? "warn" : "bad"} />
        <MetricCard icon="🏷" label="H1 Tags" value={headings.h1}
          sub={headings.h1 === 1 ? "Ideal" : headings.h1 === 0 ? "Missing!" : "Too many"}
          status={headings.h1 === 1 ? "good" : headings.h1 === 0 ? "bad" : "warn"} />
        <MetricCard icon="📑" label="H2 / H3" value={`${headings.h2} / ${headings.h3}`}
          sub="Subheadings" status={headings.h2 > 0 ? "good" : "warn"} />
        <MetricCard icon="🎯" label="CTAs" value={ctaCount}
          sub={ctaCount === 0 ? "None detected" : "Detected"}
          status={ctaCount >= 1 ? "good" : "bad"} />
        <MetricCard icon="🔗" label="Internal Links" value={links.internal} sub="Same domain" status="neutral"/>
        <MetricCard icon="↗" label="External Links" value={links.external} sub="Other domains" status="neutral"/>
        <MetricCard icon="🖼" label="Images" value={images.total} sub={`${images.missingAlt} missing alt`}
          status={images.missingAltPercent === 0 ? "good" : images.missingAltPercent < 50 ? "warn" : "bad"} />
        <MetricCard icon="♿" label="Missing Alt" value={`${images.missingAltPercent}%`}
          sub={images.missingAltPercent === 0 ? "All covered" : `${images.missingAlt} of ${images.total}`}
          status={images.missingAltPercent === 0 ? "good" : images.missingAltPercent < 50 ? "warn" : "bad"} />
      </div>
      {metrics.ctaElements?.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-body font-semibold uppercase tracking-widest text-ink/40 mb-2">Detected CTAs</h3>
          <div className="flex flex-wrap gap-2">
            {metrics.ctaElements.map((cta, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 bg-amber-pale border border-amber-audit/20 text-ink text-xs font-mono px-2.5 py-1 rounded-lg">
                <span className="text-amber-audit text-[10px] uppercase font-semibold">{cta.type}</span>
                {cta.text}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
EOF

cat > $PROJECT/client/src/components/Insights.jsx << 'EOF'
import React, { useState } from "react";

const INSIGHT_CONFIG = {
  seo:          { label: "SEO Structure",      accent: "#1a7a4a", bg: "#d1f2e1" },
  messaging:    { label: "Messaging Clarity",  accent: "#7c3aed", bg: "#ede9fe" },
  cta:          { label: "CTA Effectiveness",  accent: "#e8a000", bg: "#fff4d6" },
  contentDepth: { label: "Content Depth",      accent: "#0369a1", bg: "#e0f2fe" },
  ux:           { label: "UX & Structure",     accent: "#be185d", bg: "#fce7f3" },
};

function InsightCard({ insightKey, text }) {
  const [expanded, setExpanded] = useState(true);
  const config = INSIGHT_CONFIG[insightKey];
  return (
    <div className="rounded-xl border overflow-hidden hover:shadow-card transition-shadow" style={{ borderColor: config.accent + "30" }}>
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        style={{ backgroundColor: config.bg + "80" }}>
        <span className="font-body font-semibold text-sm text-ink" style={{ color: config.accent }}>{config.label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          className={`text-ink/30 transition-transform ${expanded ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {expanded && <div className="px-4 py-3 bg-white"><p className="text-sm font-body text-ink/80 leading-relaxed">{text}</p></div>}
    </div>
  );
}

export default function Insights({ insights, provider }) {
  return (
    <div className="section-card animate-fade-up animate-fade-up-2">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display text-2xl text-ink">AI Insights</h2>
          <p className="text-xs font-body text-ink/40 mt-1">Grounded in the extracted metrics above</p>
        </div>
        <span className="flex-shrink-0 inline-flex items-center gap-1.5 bg-ink text-paper text-[10px] font-mono font-medium px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-light inline-block"/>
          {provider === "gemini" ? "Gemini 1.5 Flash" : "GPT-4o Mini"}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {Object.entries(insights).map(([key, text]) => <InsightCard key={key} insightKey={key} text={text}/>)}
      </div>
    </div>
  );
}
EOF

cat > $PROJECT/client/src/components/Recommendations.jsx << 'EOF'
import React from "react";

const PRIORITY_CONFIG = {
  1: { label: "Critical", color: "#b91c1c", bg: "#fee2e2" },
  2: { label: "High",     color: "#b45309", bg: "#fef3c7" },
  3: { label: "Medium",   color: "#0369a1", bg: "#e0f2fe" },
  4: { label: "Low",      color: "#1a7a4a", bg: "#d1f2e1" },
  5: { label: "Low",      color: "#1a7a4a", bg: "#d1f2e1" },
};

function RecommendationCard({ rec }) {
  const p = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG[3];
  return (
    <div className="flex gap-4 p-5 bg-white rounded-xl border border-paper-mid hover:shadow-card transition-shadow">
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-display text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: p.bg, color: p.color }}>{rec.priority}</div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h3 className="font-body font-semibold text-sm text-ink">{rec.issue}</h3>
          <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ color: p.color, backgroundColor: p.bg }}>{p.label}</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ink/30 flex-shrink-0 pt-px">Why</span>
            <p className="text-sm font-body text-ink/60 leading-relaxed">{rec.reason}</p>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ink/30 flex-shrink-0 pt-px">Do</span>
            <p className="text-sm font-body text-ink font-medium leading-relaxed">{rec.action}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Recommendations({ recommendations }) {
  return (
    <div className="section-card animate-fade-up animate-fade-up-3">
      <div className="mb-5">
        <h2 className="font-display text-2xl text-ink">Recommendations</h2>
        <p className="text-xs font-body text-ink/40 mt-1">{recommendations.length} prioritized actions, ordered by impact</p>
      </div>
      <div className="flex flex-col gap-3">
        {recommendations.map((rec, i) => <RecommendationCard key={i} rec={rec}/>)}
      </div>
      <div className="mt-5 pt-4 border-t border-paper-mid flex items-center gap-2 text-xs font-body text-ink/30">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Recommendations are AI-generated and grounded in the metrics above. Always validate with your team.
      </div>
    </div>
  );
}
EOF

cat > $PROJECT/client/src/App.jsx << 'EOF'
import React, { useState } from "react";
import UrlForm from "./components/UrlForm.jsx";
import Metrics from "./components/Metrics.jsx";
import Insights from "./components/Insights.jsx";
import Recommendations from "./components/Recommendations.jsx";

function LoadingSkeleton() {
  return (
    <div className="space-y-6 mt-8">
      {[1,2,3].map(i => (
        <div key={i} className="section-card">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-paper-mid rounded-lg w-1/3"/>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1,2,3,4].map(j => <div key={j} className="h-20 bg-paper rounded-xl"/>)}
            </div>
            <div className="h-4 bg-paper-mid rounded w-2/3"/>
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorCard({ message, onReset }) {
  return (
    <div className="mt-8 section-card border-signal-red/20 bg-signal-redLight/20 animate-fade-up animate-fade-up-1">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-signal-redLight flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-body font-semibold text-signal-red mb-1">Audit Failed</h3>
          <p className="text-sm font-body text-ink/70 leading-relaxed">{message}</p>
          <button onClick={onReset} className="mt-3 text-sm font-body font-medium text-ink underline underline-offset-2 hover:no-underline">
            Try again →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleAudit(url) {
    setStatus("loading"); setResult(null); setError("");
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed.");
      setResult(data); setStatus("success");
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(err.message || "Something went wrong."); setStatus("error");
    }
  }

  function handleReset() { setStatus("idle"); setResult(null); setError(""); }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-paper/80 backdrop-blur-md border-b border-paper-mid">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f9f6f0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <span className="font-display text-lg text-ink">PageLens</span>
          </div>
          <div className="w-px h-5 bg-paper-mid mx-1 hidden sm:block"/>
          <div className="flex-1"><UrlForm onSubmit={handleAudit} isLoading={status === "loading"}/></div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {status === "idle" && (
          <div className="text-center pt-6 mb-6">
            <div className="inline-flex items-center gap-2 bg-amber-pale border border-amber-audit/20 text-amber-audit text-xs font-semibold px-3 py-1.5 rounded-full mb-4 font-body">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-audit inline-block"/>
              AI-Powered · SEO + UX + Messaging
            </div>
            <h1 className="font-display text-4xl sm:text-5xl text-ink leading-tight mb-3">
              Website audit in<br/><em className="not-italic text-amber-audit">seconds.</em>
            </h1>
            <p className="font-body text-ink/50 text-base max-w-md mx-auto leading-relaxed">
              Real metrics. AI analysis grounded in data. No fluff, no generic advice.
            </p>
          </div>
        )}

        <div id="results">
          {status === "loading" && <LoadingSkeleton/>}
          {status === "error" && <ErrorCard message={error} onReset={handleReset}/>}
          {status === "success" && result && (
            <div className="space-y-6">
              <Metrics metrics={result.metrics} seoScore={result.seoScore}/>
              <Insights insights={result.insights} provider={result.provider}/>
              <Recommendations recommendations={result.recommendations}/>
              <div className="flex justify-center pt-2 pb-8">
                <button onClick={handleReset} className="flex items-center gap-2 text-sm font-body text-ink/40 hover:text-ink transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10"/>
                    <path d="M3.51 15a9 9 0 1 0 .49-3.01"/>
                  </svg>
                  Audit another page
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
EOF

# ==============================================================================
# DONE
# ==============================================================================

echo ""
echo "✅  Project created at: ./$PROJECT/"
echo ""
echo "Next steps:"
echo "  1. cd $PROJECT/server && npm install"
echo "  2. cd ../client && npm install"
echo "  3. cp server/.env.example server/.env"
echo "  4. Add your GEMINI_API_KEY to server/.env"
echo "  5. cd server && npm run dev   (Terminal 1)"
echo "  6. cd client && npm run dev   (Terminal 2)"
echo "  7. Open http://localhost:5173"
echo ""

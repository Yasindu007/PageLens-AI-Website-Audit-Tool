# PageLens – AI Website Audit Tool

AI-powered website audit tool that analyzes SEO, content, and UX using structured data and LLM-driven insights. Built with React (Vite + Tailwind CSS), Node.js (Express), and Google Gemini.

---

## Features

- **SEO Metrics Extraction** — title, meta description, canonical URL, Open Graph tags, robots, viewport
- **Heading Structure Analysis** — H1–H6 counts and text
- **Link Mapping** — internal vs. external link counts and previews
- **Image Audit** — alt text coverage with accessibility warnings
- **Content Analysis** — word count and page size
- **AI-Powered Insights** — Google Gemini 1.5 Flash generates structured insights and prioritized recommendations
- **Scored Dashboard** — overall score (0–100), letter grade, and per-category scores with progress bars
- **Structured JSON Outputs** — clean separation between scraping and AI layers
- **Logging** — Winston logs AI prompts, responses, and errors to console + files

---

## Architecture

```
PageLens/
├── server/                     # Node.js + Express backend
│   ├── src/
│   │   ├── index.js            # Express app entry point
│   │   ├── routes/
│   │   │   └── audit.js        # POST /api/audit route
│   │   ├── services/
│   │   │   ├── scraper.js      # Axios + Cheerio scraping layer
│   │   │   └── aiAnalyzer.js   # Google Gemini AI layer
│   │   └── utils/
│   │       └── logger.js       # Winston logger
│   └── .env.example
│
└── client/                     # React + Vite + Tailwind CSS frontend
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── Header.jsx
    │   │   ├── AuditForm.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── ScoreGauge.jsx
    │   │   ├── CategoryScores.jsx
    │   │   ├── SeoMetrics.jsx
    │   │   ├── AiInsights.jsx
    │   │   └── LoadingSpinner.jsx
    │   └── index.css
    └── vite.config.js
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- A Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

### 1. Install dependencies

```bash
# From the project root
npm run install:all
```

### 2. Configure environment variables

```bash
cp server/.env.example server/.env
# Edit server/.env and set your GEMINI_API_KEY
```

### 3. Start the backend

```bash
npm run dev:server
# Server runs on http://localhost:5000
```

### 4. Start the frontend

```bash
npm run dev:client
# App runs on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API

### `POST /api/audit`

**Request body:**
```json
{ "url": "https://example.com" }
```

**Response:**
```json
{
  "success": true,
  "url": "https://example.com",
  "metrics": {
    "title": "...",
    "metaDescription": "...",
    "headingCounts": { "h1": 1, "h2": 5, ... },
    "links": { "internalCount": 12, "externalCount": 4, ... },
    "images": { "total": 8, "withAlt": 7, "withoutAlt": 1 },
    "wordCount": 842,
    "pageSizeBytes": 34520
  },
  "analysis": {
    "overallScore": 78,
    "grade": "B",
    "summary": "...",
    "insights": [...],
    "recommendations": [...],
    "scores": { "title": 90, "metaTags": 70, ... }
  }
}
```

### `GET /health`

Returns `{ "status": "ok" }` — useful for health checks.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Server port |
| `GEMINI_API_KEY` | Yes* | — | Google Gemini API key |

*If `GEMINI_API_KEY` is not set, the server falls back to a deterministic mock analysis.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Lucide React |
| Backend | Node.js, Express 4 |
| Scraping | Axios, Cheerio |
| AI | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| Logging | Winston |


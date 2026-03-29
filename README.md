# PageLens - AI Website Audit Tool

PageLens is an internal-style website audit tool for marketing teams. It combines deterministic scraping with structured Gemini analysis so every recommendation can be traced back to measurable page inputs.

Repository: `https://github.com/Yasindu007/PageLens-AI-Website-Audit-Tool`

Scope: this tool analyzes one page at a time. It does not perform multi-page crawling.

## Interface

- Deployed web app: `https://page-lens-ai-website-audit-tool.vercel.app/`
- API health check: `https://pagelens-ai-website-audit-tool.onrender.com/api/health`
- Structured audit endpoint: `POST https://pagelens-ai-website-audit-tool.onrender.com/api/audit`
- Prompt logs endpoint: `GET https://pagelens-ai-website-audit-tool.onrender.com/api/logs`

## Updated File Structure

```text
.
|-- client
|   |-- .env.example
|   |-- index.html
|   |-- package.json
|   |-- src
|   |   |-- App.jsx
|   |   |-- components
|   |   |   |-- Insights.jsx
|   |   |   |-- Metrics.jsx
|   |   |   |-- Recommendations.jsx
|   |   |   `-- UrlForm.jsx
|   |   |-- index.css
|   |   `-- main.jsx
|   `-- vite.config.js
|-- logs
|   `-- promptLogs.json
`-- server
    |-- .env.example
    |-- ai
    |   |-- gemini.js
    |   |-- logger.js
    |   `-- prompt.js
    |-- routes
    |   `-- audit.js
    |-- scraper
    |   `-- scraper.js
    |-- utils
    |   |-- parser.js
    |   |-- score.js
    |   `-- validateAI.js
    `-- server.js
```

## Architecture

```text
React UI (Vercel)
  -> POST /api/audit
Express API (Render)
  -> URL validation
  -> deterministic scraping
  -> SEO score + penalty breakdown
  -> prompt construction
  -> Gemini structured analysis
  -> AI validation
  -> prompt log persistence
  -> JSON response to UI
```

## AI Design

The system is intentionally split into deterministic and non-deterministic stages:

1. Scraping extracts measurable page facts such as headings, images, links, CTAs, and content.
2. Scoring applies transparent penalties to generate a score and a breakdown.
3. Prompt engineering passes only those structured inputs into the model.
4. Validation rejects malformed AI output before it is returned.
5. Logging persists the full trace for auditability.

This separation matters because the model should interpret evidence, not invent it. The scraper and score utilities produce stable inputs. The AI layer only generates analysis and recommendations from those inputs.

## Prompt Engineering

The system prompt is intentionally strict:

- only use provided data
- always reference numeric metrics
- be specific and actionable
- return strict JSON only
- no extra text

The user prompt includes:

- raw deterministic metrics
- SEO score
- score breakdown
- page content excerpt
- exact JSON schema expected from the model

This reduces hallucination risk and makes the output easier to validate and debug.

## Traceability And Logging

Every completed audit appends a trace entry to [`logs/promptLogs.json`](/e:/PageLens-AI-Website-Audit-Tool/logs/promptLogs.json).

Prompt traces are available in two places:

- file-based logs: [`logs/promptLogs.json`](/e:/PageLens-AI-Website-Audit-Tool/logs/promptLogs.json)
- API endpoint: `GET /logs`

Each log entry stores:

- `timestamp`
- `systemPrompt`
- `userPrompt`
- `input`
- `rawOutput`

The logs are also exposed through `GET /api/logs` so the AI trace can be inspected from the UI or externally.

## Structured Output Validation

AI output is validated in [`server/utils/validateAI.js`](/e:/PageLens-AI-Website-Audit-Tool/server/utils/validateAI.js).

The validation layer ensures:

- valid JSON
- required `insights` keys
- recommendation array presence
- valid string priorities: `Critical`, `High`, `Medium`, `Low`
- required `issue`, `reason`, and `action` fields

If the model returns invalid structured output, the request is retried once before failing with a controlled error.

## SEO Score Breakdown

The score utility in [`server/utils/score.js`](/e:/PageLens-AI-Website-Audit-Tool/server/utils/score.js) starts at `100` and applies transparent penalties:

- missing alt text over 50%: `-15`
- multiple H1 tags: `-5`
- CTA count over 50: `-5`

The frontend shows both the score and the penalty breakdown so users can see exactly why a page lost points.

## Error Handling

The system returns meaningful errors for:

- invalid URL input
- scraping failures
- Gemini quota issues
- Gemini temporary overload
- invalid AI JSON
- log persistence failures

Temporary Gemini overload and quota problems are normalized into cleaner messages so the user sees operationally useful feedback rather than raw provider dumps.

## Setup

1. Install dependencies:
   ```bash
   npm run install:all
   ```
2. Copy `server/.env.example` to `server/.env`
3. Copy `client/.env.example` to `client/.env` if needed
4. Set the required environment variables

Server:

```env
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-2.0-flash
CLIENT_ORIGINS=http://localhost:5173,https://your-app.vercel.app
ALLOW_VERCEL_PREVIEWS=false
PORT=3001
NODE_ENV=development
```

Client:

```env
VITE_API_BASE_URL=http://localhost:3001
```

## Local Development

Run the backend:

```bash
cd server
npm run dev
```

Run the frontend:

```bash
cd client
npm run dev
```

## Deployment

Frontend:

- Platform: Vercel
- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Env: `VITE_API_BASE_URL=https://pagelens-ai-website-audit-tool.onrender.com`

Backend:

- Platform: Render
- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Set `GEMINI_API_KEY`, `CLIENT_ORIGINS`, and optional `GEMINI_MODEL`

## Trade-Offs

- The score is intentionally simple and auditable rather than exhaustive.
- The model output is tightly constrained, which improves reliability but can limit nuance.
- Prompt logs improve debuggability but should be treated as sensitive operational data.
- The scraper focuses on the visible page snapshot rather than full crawling or JS-rendered multi-page analysis.

## Future Improvements

- Add pagination and filtering to `GET /api/logs`
- Add test coverage for prompt validation and score breakdown rules
- Persist traces in a database instead of a JSON file for multi-user environments
- Add more deterministic scoring rules for title length, description coverage, and heading hierarchy quality
- Add trace comparison views across multiple audits of the same page

# PageLens - AI Website Audit Tool

AI-powered website audit tool that analyzes SEO, content, and UX using deterministic scraping plus Gemini-generated insights. Built with React, Node.js, Express, and Google Gemini.

## Setup

1. Install dependencies:
   ```bash
   npm run install:all
   ```
2. Create `server/.env` from `server/.env.example`.
3. Set:
   ```env
   GEMINI_API_KEY=your_api_key
   GEMINI_MODEL=gemini-2.0-flash
   PORT=3001
   ```

## Gemini Model Note

This project uses Gemini. Set `GEMINI_MODEL=gemini-2.0-flash` in `server/.env`.

If `GEMINI_MODEL` is omitted, the server falls back through:
- `gemini-2.0-flash`
- `gemini-2.0-flash-001`
- `gemini-flash-latest`

This note is included so evaluators do not hit a Gemini API 404 caused by an outdated or invalid model name.

## Prompt Log Deliverable

Each completed audit appends a prompt trace to [`logs/promptLogs.json`](/e:/PageLens-AI-Website-Audit-Tool/logs/promptLogs.json), including:
- timestamp
- provider
- resolved model
- system prompt
- user prompt
- structured input summary
- raw AI JSON response

The audit route is intended to persist this file for every completed audit so the full trace can be inspected after a run.

// server/routes/audit.js
// ─────────────────────────────────────────────────────────────────────────────
// Audit route: orchestrates the scraper → AI pipeline.
// Clean separation: scraper runs first (deterministic), then AI layer.
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { scrapePage } from "../scraper/scraper.js";
import { runAiAnalysis } from "../ai/gemini.js";
import { buildPromptLog } from "../ai/prompt.js";
import { appendPromptLog } from "../ai/logger.js";
import { validateUrl, calculateSeoScore } from "../utils/parser.js";

const router = Router();

/**
 * POST /api/audit
 * Body: { url: string }
 * Returns: { metrics, seoScore, insights, recommendations, provider, model }
 */
router.post("/audit", async (req, res, next) => {
  try {
    const { url: rawUrl } = req.body;

    // ── Step 1: Validate URL ────────────────────────────────────────────────
    const { valid, url, reason } = validateUrl(rawUrl);
    if (!valid) {
      return res.status(400).json({ error: reason });
    }

    console.log(`[Audit] Starting → ${url}`);

    // ── Step 2: Scrape (deterministic, no AI) ──────────────────────────────
    let metrics, pageContent;
    try {
      ({ metrics, pageContent } = await scrapePage(url));
    } catch (err) {
      return res.status(422).json({ error: `Scraping failed: ${err.message}` });
    }

    console.log(`[Audit] Scraped: ${metrics.wordCount} words, ${metrics.images.total} images`);

    // ── Step 3: Calculate SEO score (deterministic) ────────────────────────
    const seoScore = calculateSeoScore(metrics);

    // ── Step 4: AI analysis ────────────────────────────────────────────────
    let parsed, rawResponse, provider, model;
    try {
      ({ parsed, raw: rawResponse, provider, model } = await runAiAnalysis({
        metrics,
        pageContent,
        seoScore,
      }));
    } catch (err) {
      return res.status(502).json({ error: `AI analysis failed: ${err.message}` });
    }

    console.log(`[Audit] AI complete via ${provider}`);

    // ── Step 5: Log the prompt ─────────────────────────────────────────────
    const logEntry = buildPromptLog({
      metrics,
      pageContent,
      seoScore,
      rawResponse,
      provider,
      model,
    });
    await appendPromptLog(logEntry);

    // ── Step 6: Return structured response ────────────────────────────────
    return res.json({
      url,
      metrics,
      seoScore,
      insights: parsed.insights,
      recommendations: parsed.recommendations,
      provider,
      model,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/health
 * Quick health check — confirms which AI provider is configured.
 */
router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    aiProvider: process.env.GEMINI_API_KEY
      ? "gemini"
      : process.env.OPENAI_API_KEY
      ? "openai"
      : "none",
  });
});

export default router;

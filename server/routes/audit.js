import { Router } from "express";
import { scrapePage } from "../scraper/scraper.js";
import { runAiAnalysis } from "../ai/gemini.js";
import { buildPromptLog } from "../ai/prompt.js";
import { appendPromptLog, readPromptLogs } from "../ai/logger.js";
import { validateUrl } from "../utils/parser.js";
import { calculateSeoScore } from "../utils/score.js";
import { createAuditJob, getAuditJob, updateAuditJob } from "../utils/auditJobs.js";

const router = Router();
const AUDIT_STEPS = [
  "Validating URL",
  "Scraping page",
  "Scoring page",
  "Generating AI insights",
  "Validating structured output",
  "Writing audit trace",
  "Complete",
];

router.post("/audit", async (req, res, next) => {
  try {
    const payload = await executeAudit(req.body?.url);
    return res.json(payload);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || "Audit failed." });
  }
});

router.post("/audit/start", async (req, res) => {
  const rawUrl = req.body?.url;
  const job = createAuditJob(rawUrl || null);

  executeAudit(rawUrl, {
    onProgress(progress) {
      updateAuditJob(job.id, { status: "running", progress });
    },
  })
    .then((result) => {
      updateAuditJob(job.id, {
        status: "completed",
        result,
        progress: {
          step: "Complete",
          message: "Audit complete. Results are ready.",
          steps: AUDIT_STEPS,
        },
      });
    })
    .catch((err) => {
      updateAuditJob(job.id, {
        status: "failed",
        error: err.message || "Audit failed.",
      });
    });

  return res.status(202).json({ jobId: job.id });
});

router.get("/audit/:jobId", (req, res) => {
  const job = getAuditJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: "Audit job not found." });
  }

  return res.json(job);
});

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

router.get("/logs", async (_req, res, next) => {
  try {
    const logs = await readPromptLogs();
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

export default router;

async function executeAudit(rawUrl, options = {}) {
  const reportProgress = (step, message) => {
    options.onProgress?.({
      step,
      message,
      steps: AUDIT_STEPS,
    });
  };

  reportProgress("Validating URL", "Validating the submitted URL.");
  const { valid, url, reason } = validateUrl(rawUrl);
  if (!valid) {
    throw withStatus(reason, 400);
  }

  console.log(`[Audit] Starting -> ${url}`);

  reportProgress("Scraping page", "Fetching the page and extracting deterministic metrics.");
  let metrics;
  let pageContent;
  try {
    ({ metrics, pageContent } = await scrapePage(url));
  } catch (err) {
    throw withStatus(`Scraping failed: ${err.message}`, 422);
  }

  reportProgress("Scoring page", "Computing the SEO score and penalty breakdown.");
  const { score: seoScore, breakdown: seoBreakdown } = calculateSeoScore(metrics);

  reportProgress("Generating AI insights", "Sending the structured audit context to the AI layer.");
  let parsed;
  let rawResponse;
  let provider;
  let model;
  try {
    ({ parsed, raw: rawResponse, provider, model } = await runAiAnalysis({
      metrics,
      pageContent,
      seoScore,
      seoBreakdown,
      onProgress(message) {
        reportProgress("Generating AI insights", message);
      },
    }));
  } catch (err) {
    throw withStatus(`AI analysis failed: ${err.message}`, 502);
  }

  reportProgress("Validating structured output", "Checking the AI response against the required JSON schema.");

  reportProgress("Writing audit trace", "Persisting the prompt trace for auditability.");
  const logEntry = buildPromptLog({
    metrics,
    pageContent,
    seoScore,
    seoBreakdown,
    rawResponse,
  });
  await appendPromptLog(logEntry);

  console.log(`[Audit] AI complete via ${provider}`);

  return {
    url,
    metrics,
    seoScore,
    seoBreakdown,
    insights: parsed.insights,
    recommendations: parsed.recommendations,
    provider,
    model,
    trace: logEntry,
  };
}

function withStatus(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

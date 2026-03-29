// server/ai/gemini.js
// AI LAYER - takes structured JSON input, calls Gemini,
// returns parsed structured JSON output.

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt.js";
import { validateAiResponse } from "../utils/validateAI.js";

const DEFAULT_GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-flash-latest",
];
const GEMINI_MODELS = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL, ...DEFAULT_GEMINI_MODELS.filter((model) => model !== process.env.GEMINI_MODEL)]
  : DEFAULT_GEMINI_MODELS;
const MAX_RETRIES_PER_MODEL = 4;
const BASE_RETRY_DELAY_MS = 2000;
const MAX_RETRY_DELAY_MS = 20000;
const AI_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  required: ["insights", "recommendations"],
  properties: {
    insights: {
      type: SchemaType.OBJECT,
      required: ["seo", "messaging", "cta", "contentDepth", "ux"],
      properties: {
        seo: { type: SchemaType.STRING },
        messaging: { type: SchemaType.STRING },
        cta: { type: SchemaType.STRING },
        contentDepth: { type: SchemaType.STRING },
        ux: { type: SchemaType.STRING },
      },
    },
    recommendations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        required: ["priority", "issue", "reason", "action"],
        properties: {
          priority: { type: SchemaType.STRING, enum: ["Critical", "High", "Medium", "Low"] },
          issue: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
          action: { type: SchemaType.STRING },
        },
      },
    },
  },
};

/**
 * Run AI analysis against the extracted metrics.
 * Uses Gemini only.
 *
 * @param {{ metrics: object, pageContent: string, seoScore: number, seoBreakdown: object[], onProgress?: Function }} input
 * @returns {Promise<{ parsed: object, raw: string, provider: string, model?: string }>}
 */
export async function runAiAnalysis({ metrics, pageContent, seoScore, seoBreakdown, onProgress }) {
  const userPrompt = buildUserPrompt({ metrics, pageContent, seoScore, seoBreakdown });

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  try {
    return await callGemini(userPrompt, onProgress);
  } catch (err) {
    throw new Error(`Gemini analysis failed. ${err.message}`);
  }
}

async function callGemini(userPrompt, onProgress) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  let lastError;

  for (const modelName of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        onProgress?.(`Generating AI insights via ${modelName} (attempt ${attempt}/${MAX_RETRIES_PER_MODEL}).`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.9,
            maxOutputTokens: 2500,
            responseMimeType: "application/json",
            responseSchema: AI_RESPONSE_SCHEMA,
          },
        });

        const { parsed, raw } = await generateValidatedContent(model, userPrompt);

        return { parsed, raw, provider: "gemini", model: modelName };
      } catch (err) {
        lastError = err;

        if (!isRetryableGeminiError(err) || attempt === MAX_RETRIES_PER_MODEL) {
          break;
        }

        const retryDelayMs = getRetryDelayMs(err, attempt);
        onProgress?.(`Gemini is busy on ${modelName}. Retrying in ${Math.ceil(retryDelayMs / 1000)}s.`);
        await sleep(retryDelayMs);
      }
    }
  }

  throw formatGeminiError(lastError);
}

function isRetryableGeminiError(err) {
  const message = String(err?.message || "");
  return /\b(429|500|502|503|504)\b/.test(message) ||
    /high demand|temporar|unavailable|overloaded|rate limit/i.test(message);
}

function getRetryDelayMs(err, attempt) {
  const hintedDelayMs = extractRetryDelayMs(err);
  if (hintedDelayMs) {
    return Math.min(hintedDelayMs, MAX_RETRY_DELAY_MS);
  }

  const exponentialDelay = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1);
  return Math.min(exponentialDelay, MAX_RETRY_DELAY_MS);
}

function extractRetryDelayMs(err) {
  const message = String(err?.message || "");
  const jsonMatches = [...message.matchAll(/"retryDelay"\s*:\s*"([^"]+)"/g)];
  for (const match of jsonMatches) {
    const parsed = parseDurationToMs(match[1]);
    if (parsed) return parsed;
  }

  const textMatch = message.match(/Please retry in\s+([\d.]+)(ms|s|m|h)\b/i);
  if (textMatch) {
    const parsed = parseDurationToMs(`${textMatch[1]}${textMatch[2]}`);
    if (parsed) return parsed;
  }

  return null;
}

function parseDurationToMs(durationText) {
  if (!durationText) return null;

  const normalized = durationText.trim().toLowerCase();
  const match = normalized.match(/^([\d.]+)\s*(ms|s|m|h)$/);
  if (!match) return null;

  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;

  const unit = match[2];
  if (unit === "ms") return Math.round(value);
  if (unit === "s") return Math.round(value * 1000);
  if (unit === "m") return Math.round(value * 60_000);
  if (unit === "h") return Math.round(value * 3_600_000);

  return null;
}

function formatGeminiError(err) {
  const message = String(err?.message || "Unknown error.");

  if (isTemporaryCapacityError(message)) {
    return new Error("Gemini is under high demand right now. Please retry in 1-2 minutes.");
  }

  if (isQuotaError(message)) {
    return new Error("Gemini quota is currently exhausted for this project. Please try again later or use a key with available quota.");
  }

  return new Error(
    `Gemini failed for models ${GEMINI_MODELS.join(", ")}. ${message}`
  );
}

function isTemporaryCapacityError(message) {
  return /\b(503|504)\b/.test(message) ||
    /high demand|temporar(?:ily)? unavailable|service unavailable|overloaded/i.test(message);
}

function isQuotaError(message) {
  return /\b429\b/.test(message) ||
    /quota exceeded|rate limit|billing details|free_tier/i.test(message);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateValidatedContent(model, userPrompt) {
  let lastValidationError;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await model.generateContent(userPrompt);
    const raw = result.response.text();

    try {
      const parsed = validateAiResponse(raw);
      return { parsed, raw };
    } catch (err) {
      lastValidationError = err;

      if (attempt === 2) {
        break;
      }
    }
  }

  throw new Error(`AI returned invalid structured output after 2 attempts. ${lastValidationError?.message || ""}`.trim());
}

// server/ai/gemini.js
// AI LAYER - takes structured JSON input, calls Gemini,
// returns parsed structured JSON output.

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt.js";

const GEMINI_MODELS = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL]
  : ["gemini-2.0-flash", "gemini-2.0-flash-001", "gemini-flash-latest"];
const MAX_RETRIES_PER_MODEL = 3;
const RETRY_DELAY_MS = 1500;
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
          priority: { type: SchemaType.INTEGER },
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
 * @param {{ metrics: object, pageContent: string, seoScore: number }} input
 * @returns {Promise<{ parsed: object, raw: string, provider: string, model?: string }>}
 */
export async function runAiAnalysis({ metrics, pageContent, seoScore }) {
  const userPrompt = buildUserPrompt({ metrics, pageContent, seoScore });

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  try {
    return await callGemini(userPrompt);
  } catch (err) {
    throw new Error(`Gemini analysis failed. ${err.message}`);
  }
}

async function callGemini(userPrompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  let lastError;

  for (const modelName of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
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

        const result = await model.generateContent(userPrompt);
        const raw = result.response.text();
        const parsed = safeParseJson(raw);

        validateAiOutput(parsed);

        return { parsed, raw, provider: "gemini", model: modelName };
      } catch (err) {
        lastError = err;

        if (!isRetryableGeminiError(err) || attempt === MAX_RETRIES_PER_MODEL) {
          break;
        }

        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw new Error(
    `Gemini failed for models ${GEMINI_MODELS.join(", ")}. ${lastError?.message || "Unknown error."}`
  );
}

function isRetryableGeminiError(err) {
  const message = String(err?.message || "");
  return /\b(429|500|502|503|504)\b/.test(message) ||
    /high demand|temporar|unavailable|overloaded|rate limit/i.test(message);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeParseJson(text) {
  if (!text) throw new Error("AI returned empty response.");

  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
    throw new Error(`AI response was not valid JSON. Raw: ${cleaned.substring(0, 200)}`);
  }
}

function validateAiOutput(parsed) {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI output is not a JSON object.");
  }
  if (!parsed.insights || typeof parsed.insights !== "object") {
    throw new Error("AI output missing 'insights' object.");
  }
  if (!Array.isArray(parsed.recommendations)) {
    throw new Error("AI output missing 'recommendations' array.");
  }

  const requiredInsights = ["seo", "messaging", "cta", "contentDepth", "ux"];
  for (const key of requiredInsights) {
    if (typeof parsed.insights[key] !== "string") {
      throw new Error(`AI output missing insights.${key}`);
    }
  }
}

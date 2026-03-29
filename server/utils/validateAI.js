const PRIORITIES = new Set(["Critical", "High", "Medium", "Low"]);
const REQUIRED_INSIGHTS = ["seo", "messaging", "cta", "contentDepth", "ux"];

export function validateAiResponse(text) {
  const parsed = parseAiJson(text);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AI output is not a JSON object.");
  }

  if (!parsed.insights || typeof parsed.insights !== "object" || Array.isArray(parsed.insights)) {
    throw new Error("AI output missing insights object.");
  }

  for (const key of REQUIRED_INSIGHTS) {
    if (typeof parsed.insights[key] !== "string" || !parsed.insights[key].trim()) {
      throw new Error(`AI output missing insights.${key}`);
    }
  }

  if (!Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0) {
    throw new Error("AI output missing recommendations array.");
  }

  for (const [index, recommendation] of parsed.recommendations.entries()) {
    if (!recommendation || typeof recommendation !== "object" || Array.isArray(recommendation)) {
      throw new Error(`Recommendation ${index + 1} is invalid.`);
    }

    if (!PRIORITIES.has(recommendation.priority)) {
      throw new Error(`Recommendation ${index + 1} has invalid priority.`);
    }

    for (const field of ["issue", "reason", "action"]) {
      if (typeof recommendation[field] !== "string" || !recommendation[field].trim()) {
        throw new Error(`Recommendation ${index + 1} missing ${field}.`);
      }
    }
  }

  return parsed;
}

function parseAiJson(text) {
  if (!text || typeof text !== "string") {
    throw new Error("AI returned empty response.");
  }

  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error(`AI response was not valid JSON. Raw: ${cleaned.slice(0, 200)}`);
  }
}

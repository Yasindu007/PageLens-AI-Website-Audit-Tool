// server/ai/prompt.js
// Prompt construction and prompt logging for the AI analysis layer.

export const SYSTEM_PROMPT = `You are a senior SEO and UX analyst at a digital agency.

Rules:
- Only use provided data
- Always reference metrics (numbers)
- Be specific and actionable
- Output STRICT JSON
- No extra text`;

/**
 * Build the user prompt from structured data.
 * @param {{ metrics: object, pageContent: string, seoScore: number }} input
 * @returns {string}
 */
export function buildUserPrompt({ metrics, pageContent, seoScore, seoBreakdown }) {
  const metricsJson = JSON.stringify(metrics, null, 2);
  const breakdownJson = JSON.stringify(seoBreakdown, null, 2);

  return `Analyze this marketing webpage using only the deterministic inputs below.

Return exactly this JSON shape:
{
  "insights": {
    "seo": "string",
    "messaging": "string",
    "cta": "string",
    "contentDepth": "string",
    "ux": "string"
  },
  "recommendations": [
    {
      "priority": "Critical",
      "issue": "string",
      "reason": "string",
      "action": "string"
    }
  ]
}

Recommendation rules:
- Produce exactly 4 recommendations
- Allowed priority values: Critical, High, Medium, Low
- Tie every recommendation to the provided metrics or content
- Do not invent data

WEBPAGE METRICS:

\`\`\`json
${metricsJson}
\`\`\`

SEO Score: ${seoScore}/100

SEO Score Breakdown:

\`\`\`json
${breakdownJson}
\`\`\`

PAGE CONTENT EXCERPT:
${pageContent}

Generate the JSON analysis now.`;
}

/**
 * Return a structured trace describing what was sent to the model.
 */
export function buildPromptLog({
  metrics,
  pageContent,
  seoScore,
  seoBreakdown,
  rawResponse,
}) {
  return {
    timestamp: new Date().toISOString(),
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt({ metrics, pageContent, seoScore, seoBreakdown }),
    input: {
      metrics,
      seoScore,
      seoBreakdown,
      content: pageContent,
    },
    rawOutput: rawResponse,
  };
}

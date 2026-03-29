// server/ai/prompt.js
// Prompt construction and prompt logging for the AI analysis layer.

export const SYSTEM_PROMPT = `You are a senior SEO and UX analyst for marketing websites.

Analyze the provided webpage metrics and content excerpt.

Rules:
- Ground every insight in the supplied metrics and content only.
- Reference explicit figures when relevant.
- Avoid generic advice.
- Be concise.
- Keep each insight to 1-2 sentences and under 60 words.
- Keep recommendation fields brief and concrete.
- Do not invent data.
- Return strict JSON only.

Return exactly this shape:
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
      "priority": 1,
      "issue": "string",
      "reason": "string",
      "action": "string"
    }
  ]
}

Produce exactly 4 recommendations ordered by priority, where 1 is highest impact.`;

/**
 * Build the user prompt from structured data.
 * @param {{ metrics: object, pageContent: string, seoScore: number }} input
 * @returns {string}
 */
export function buildUserPrompt({ metrics, pageContent, seoScore }) {
  const metricsJson = JSON.stringify(metrics, null, 2);

  return `WEBPAGE METRICS (deterministic):

\`\`\`json
${metricsJson}
\`\`\`

SEO Score: ${seoScore}/100

PAGE CONTENT EXCERPT:
${pageContent}

Generate the JSON analysis now.`;
}

/**
 * Return a minimal object describing what was sent to the model for logging.
 */
export function buildPromptLog({ metrics, pageContent, seoScore, rawResponse }) {
  return {
    timestamp: new Date().toISOString(),
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt({ metrics, pageContent, seoScore }),
    inputData: {
      metrics,
      seoScore,
      pageContentWordCount: pageContent.trim() ? pageContent.trim().split(/\s+/).length : 0,
      pageContentSnippet: pageContent.substring(0, 200) + "...",
    },
    rawAiResponse: rawResponse,
  };
}

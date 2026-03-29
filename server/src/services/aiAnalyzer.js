const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Analyzes SEO metrics using Google Gemini and returns structured insights.
 * @param {object} metrics - Scraped SEO metrics.
 * @returns {Promise<object>} AI analysis result.
 */
async function analyzeWithAI(metrics) {
  logger.info(`Starting AI analysis for: ${metrics.url}`);

  const prompt = buildPrompt(metrics);
  logger.info(`AI Prompt (truncated): ${prompt.substring(0, 300)}...`);

  if (!process.env.GEMINI_API_KEY) {
    logger.warn('GEMINI_API_KEY not set — returning mock AI response');
    return getMockAnalysis(metrics);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    logger.info(`AI Response received (length: ${responseText.length} chars)`);
    logger.info(`AI Response (truncated): ${responseText.substring(0, 300)}...`);

    return parseAiResponse(responseText, metrics.url);
  } catch (err) {
    logger.error(`AI analysis failed: ${err.message}`);
    throw new Error(`AI analysis failed: ${err.message}`);
  }
}

function buildPrompt(metrics) {
  return `
You are an expert SEO analyst. Analyze the following website metrics and provide a structured audit report.

## Website Data
- **URL**: ${metrics.url}
- **Title**: ${metrics.title || 'Missing'}
- **Meta Description**: ${metrics.metaDescription || 'Missing'}
- **Meta Keywords**: ${metrics.metaKeywords || 'Not set'}
- **Canonical URL**: ${metrics.canonicalUrl || 'Not set'}
- **Robots**: ${metrics.robots || 'Not set'}
- **Viewport**: ${metrics.viewport || 'Missing'}
- **OG Title**: ${metrics.ogTitle || 'Missing'}
- **OG Description**: ${metrics.ogDescription || 'Missing'}
- **Word Count**: ${metrics.wordCount}
- **Page Size**: ${Math.round(metrics.pageSizeBytes / 1024)} KB
- **H1 Count**: ${metrics.headingCounts.h1} | H1 texts: ${metrics.headings.h1.slice(0, 3).join(', ') || 'none'}
- **H2 Count**: ${metrics.headingCounts.h2}
- **H3 Count**: ${metrics.headingCounts.h3}
- **Internal Links**: ${metrics.links.internalCount}
- **External Links**: ${metrics.links.externalCount}
- **Total Images**: ${metrics.images.total}
- **Images With Alt**: ${metrics.images.withAlt}
- **Images Without Alt**: ${metrics.images.withoutAlt}

## Instructions
Respond ONLY with a valid JSON object (no markdown, no code blocks, no explanation outside JSON) in this exact structure:
{
  "overallScore": <number 0-100>,
  "grade": "<A|B|C|D|F>",
  "summary": "<2-3 sentence overall assessment>",
  "insights": [
    {
      "category": "<Title|Meta|Headings|Content|Links|Images|Performance|Technical>",
      "severity": "<critical|warning|info|good>",
      "title": "<short title>",
      "description": "<detailed explanation>"
    }
  ],
  "recommendations": [
    {
      "priority": "<high|medium|low>",
      "category": "<same categories as above>",
      "action": "<specific actionable step>",
      "impact": "<expected improvement>"
    }
  ],
  "scores": {
    "title": <0-100>,
    "metaTags": <0-100>,
    "headings": <0-100>,
    "content": <0-100>,
    "links": <0-100>,
    "images": <0-100>,
    "technical": <0-100>
  }
}
`.trim();
}

function parseAiResponse(responseText, url) {
  try {
    // Remove possible markdown code fences
    const cleaned = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    return { ...parsed, analyzedAt: new Date().toISOString() };
  } catch (err) {
    logger.error(`Failed to parse AI JSON response: ${err.message}`);
    logger.error(`Raw AI response: ${responseText.substring(0, 500)}`);
    return {
      overallScore: 0,
      grade: 'F',
      summary: 'AI analysis could not be parsed. Please try again.',
      insights: [],
      recommendations: [],
      scores: {},
      analyzedAt: new Date().toISOString(),
      parseError: true,
    };
  }
}

function getMockAnalysis(metrics) {
  const hasTitle = !!metrics.title;
  const hasDescription = !!metrics.metaDescription;
  const h1Count = metrics.headingCounts.h1;
  const imagesWithoutAlt = metrics.images.withoutAlt;

  const insights = [];
  const recommendations = [];
  let score = 60;

  if (!hasTitle) {
    insights.push({ category: 'Title', severity: 'critical', title: 'Missing Page Title', description: 'The page has no <title> tag, which is critical for SEO.' });
    recommendations.push({ priority: 'high', category: 'Title', action: 'Add a descriptive <title> tag (50-60 characters)', impact: 'Improves click-through rates from search results' });
    score -= 15;
  } else {
    insights.push({ category: 'Title', severity: 'good', title: 'Page Title Present', description: `Title: "${metrics.title}"` });
    score += 5;
  }

  if (!hasDescription) {
    insights.push({ category: 'Meta', severity: 'warning', title: 'Missing Meta Description', description: 'No meta description found. Add one to improve SERP snippets.' });
    recommendations.push({ priority: 'high', category: 'Meta', action: 'Add a meta description (120-160 characters)', impact: 'Improves click-through rates from search results' });
    score -= 10;
  } else {
    score += 5;
  }

  if (h1Count === 0) {
    insights.push({ category: 'Headings', severity: 'critical', title: 'No H1 Tag', description: 'No H1 heading found. Every page should have exactly one H1.' });
    recommendations.push({ priority: 'high', category: 'Headings', action: 'Add a single H1 tag describing the main topic', impact: 'Signals page topic to search engines' });
    score -= 10;
  } else if (h1Count > 1) {
    insights.push({ category: 'Headings', severity: 'warning', title: 'Multiple H1 Tags', description: `Found ${h1Count} H1 tags. Best practice is to use only one H1 per page.` });
    score -= 5;
  } else {
    insights.push({ category: 'Headings', severity: 'good', title: 'Single H1 Tag', description: 'Exactly one H1 tag found — great!' });
    score += 5;
  }

  if (imagesWithoutAlt > 0) {
    insights.push({ category: 'Images', severity: 'warning', title: 'Images Missing Alt Text', description: `${imagesWithoutAlt} image(s) are missing alt text, which hurts accessibility and SEO.` });
    recommendations.push({ priority: 'medium', category: 'Images', action: 'Add descriptive alt text to all images', impact: 'Improves accessibility and image search ranking' });
    score -= 5;
  }

  if (metrics.wordCount < 300) {
    insights.push({ category: 'Content', severity: 'warning', title: 'Thin Content', description: `Only ${metrics.wordCount} words found. Pages with less than 300 words may be considered thin content.` });
    recommendations.push({ priority: 'medium', category: 'Content', action: 'Expand content to at least 300-500 words', impact: 'Reduces risk of thin content penalty' });
  } else {
    insights.push({ category: 'Content', severity: 'good', title: 'Sufficient Content', description: `${metrics.wordCount} words — good content depth.` });
    score += 5;
  }

  return {
    overallScore: Math.max(0, Math.min(100, score)),
    grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F',
    summary: `Analysis of ${metrics.url}. ${hasTitle ? 'Title is present.' : 'Title is missing.'} ${hasDescription ? 'Meta description found.' : 'Meta description missing.'} ${h1Count === 1 ? 'Heading structure looks good.' : 'Heading structure needs attention.'}`,
    insights,
    recommendations,
    scores: {
      title: hasTitle ? 85 : 0,
      metaTags: hasDescription ? 75 : 20,
      headings: h1Count === 1 ? 90 : h1Count === 0 ? 10 : 60,
      content: metrics.wordCount >= 300 ? 80 : 40,
      links: metrics.links.internalCount > 0 ? 75 : 50,
      images: imagesWithoutAlt === 0 ? 100 : Math.max(0, 100 - (imagesWithoutAlt / Math.max(metrics.images.total, 1)) * 100),
      technical: metrics.viewport ? 80 : 50,
    },
    analyzedAt: new Date().toISOString(),
  };
}

module.exports = { analyzeWithAI };

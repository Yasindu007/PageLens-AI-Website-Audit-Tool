const express = require('express');
const router = express.Router();
const { scrapeUrl } = require('../services/scraper');
const { analyzeWithAI } = require('../services/aiAnalyzer');
const logger = require('../utils/logger');

router.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A valid URL is required' });
  }

  let normalizedUrl = url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  try {
    new URL(normalizedUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  logger.info(`Audit requested for: ${normalizedUrl}`);

  try {
    const metrics = await scrapeUrl(normalizedUrl);
    const aiAnalysis = await analyzeWithAI(metrics);

    const result = {
      success: true,
      url: normalizedUrl,
      metrics,
      analysis: aiAnalysis,
    };

    logger.info(`Audit complete for: ${normalizedUrl} — Score: ${aiAnalysis.overallScore}`);
    return res.json(result);
  } catch (err) {
    logger.error(`Audit failed for ${normalizedUrl}: ${err.message}`);
    return res.status(500).json({ error: 'Audit failed. Please check the URL and try again.' });
  }
});

module.exports = router;

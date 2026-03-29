const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

/**
 * Scrapes a URL and extracts SEO metrics.
 * @param {string} url - The URL to scrape.
 * @returns {Promise<object>} SEO metrics object.
 */
async function scrapeUrl(url) {
  logger.info(`Starting scrape for: ${url}`);

  let html;
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; PageLensBot/1.0; +https://pagelens.ai)',
      },
    });
    html = response.data;
  } catch (err) {
    logger.error(`Failed to fetch URL ${url}: ${err.message}`);
    throw new Error(`Could not fetch URL: ${err.message}`);
  }

  const $ = cheerio.load(html);

  // --- Meta tags ---
  const title = $('title').text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr('content') || null;
  const metaKeywords = $('meta[name="keywords"]').attr('content') || null;
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || null;
  const ogTitle = $('meta[property="og:title"]').attr('content') || null;
  const ogDescription =
    $('meta[property="og:description"]').attr('content') || null;
  const ogImage = $('meta[property="og:image"]').attr('content') || null;
  const robots = $('meta[name="robots"]').attr('content') || null;
  const viewport = $('meta[name="viewport"]').attr('content') || null;

  // --- Headings ---
  const headings = {
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
  };
  ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach((tag) => {
    $(tag).each((_, el) => {
      const text = $(el).text().trim();
      if (text) headings[tag].push(text);
    });
  });

  // --- Links ---
  const links = { internal: [], external: [] };
  const baseHostname = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  })();
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    try {
      const resolved = new URL(href, url);
      if (resolved.hostname === baseHostname) {
        links.internal.push(resolved.href);
      } else {
        links.external.push(resolved.href);
      }
    } catch {
      // ignore invalid hrefs
    }
  });

  // --- Images ---
  const images = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt');
    images.push({
      src: src ? new URL(src, url).href : src,
      alt: alt !== undefined ? alt : null,
      hasAlt: alt !== undefined && alt.trim() !== '',
    });
  });
  const imagesWithoutAlt = images.filter((img) => !img.hasAlt).length;

  // --- Word count ---
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText ? bodyText.split(' ').filter(Boolean).length : 0;

  // --- Page size ---
  const pageSizeBytes = Buffer.byteLength(html, 'utf8');

  const metrics = {
    url,
    title,
    metaDescription,
    metaKeywords,
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogImage,
    robots,
    viewport,
    headings,
    headingCounts: {
      h1: headings.h1.length,
      h2: headings.h2.length,
      h3: headings.h3.length,
      h4: headings.h4.length,
      h5: headings.h5.length,
      h6: headings.h6.length,
    },
    links: {
      internalCount: links.internal.length,
      externalCount: links.external.length,
      internalLinks: links.internal.slice(0, 20),
      externalLinks: links.external.slice(0, 20),
    },
    images: {
      total: images.length,
      withAlt: images.length - imagesWithoutAlt,
      withoutAlt: imagesWithoutAlt,
      list: images.slice(0, 20),
    },
    wordCount,
    pageSizeBytes,
    scrapedAt: new Date().toISOString(),
  };

  logger.info(`Scrape complete for ${url}. Word count: ${wordCount}, Images: ${images.length}`);
  return metrics;
}

module.exports = { scrapeUrl };

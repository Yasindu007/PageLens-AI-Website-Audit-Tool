// server/scraper/scraper.js
// ─────────────────────────────────────────────────────────────────────────────
// SCRAPER LAYER — 100% deterministic. Zero AI involvement.
// Fetches a page and extracts structured metrics using Axios + Cheerio.
// ─────────────────────────────────────────────────────────────────────────────

import axios from "axios";
import * as cheerio from "cheerio";
import { getOrigin, countWords, truncateWords } from "../utils/parser.js";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_CONTENT_WORDS = 1000;

/**
 * CTA detection heuristics:
 * Matches common button text and high-signal action link text.
 */
const CTA_TEXT_PATTERN =
  /\b(get started|start free|try free|sign up|sign-up|signup|register|buy now|shop now|order now|contact us|get a quote|request demo|book a demo|schedule|learn more|see pricing|view plans|download|subscribe|join now|apply now|free trial|get access|claim|unlock)\b/i;

/**
 * Main scrape function.
 * @param {string} url - Validated, absolute URL.
 * @returns {Promise<{ metrics: object, pageContent: string }>}
 */
export async function scrapePage(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const origin = getOrigin(url);

  // ── 1. Meta tags ─────────────────────────────────────────────────────────
  const metaTitle =
    $("title").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    null;

  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;

  // ── 2. Headings ───────────────────────────────────────────────────────────
  const headings = {
    h1: $("h1").length,
    h2: $("h2").length,
    h3: $("h3").length,
  };

  // ── 3. Word count (visible body text only) ────────────────────────────────
  // Remove non-content elements before counting
  const $body = $("body").clone();
  $body.find("script, style, noscript, iframe, svg, [aria-hidden='true']").remove();
  const bodyText = $body.text().replace(/\s+/g, " ").trim();
  const wordCount = countWords(bodyText);

  // ── 4. Links — internal vs external ──────────────────────────────────────
  let internalLinks = 0;
  let externalLinks = 0;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return; // skip anchors, JS, mail, tel
    }

    let absolute;
    try {
      absolute = new URL(href, url).href;
    } catch {
      return;
    }

    const linkOrigin = getOrigin(absolute);
    if (linkOrigin === origin) {
      internalLinks++;
    } else {
      externalLinks++;
    }
  });

  // ── 5. Images — count + missing alt ──────────────────────────────────────
  const $images = $("img");
  const totalImages = $images.length;
  let missingAlt = 0;

  $images.each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt === null || alt.trim() === "") {
      missingAlt++;
    }
  });

  const missingAltPercent =
    totalImages > 0 ? Math.round((missingAlt / totalImages) * 100) : 0;

  // ── 6. CTAs — buttons + high-signal action links ──────────────────────────
  let ctaCount = 0;
  const ctaElements = [];

  // All <button> elements
  $("button").each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      ctaCount++;
      ctaElements.push({ type: "button", text: text.substring(0, 60) });
    }
  });

  // <a> tags with role="button" or class containing 'btn'/'button'
  $('a[role="button"], a.btn, a[class*="button"], a[class*="btn"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      ctaCount++;
      ctaElements.push({ type: "link-button", text: text.substring(0, 60) });
    }
  });

  // <a> tags whose text matches CTA patterns (not already counted above)
  $("a[href]").each((_, el) => {
    const $el = $(el);
    // Skip if already counted as a button-role link
    if ($el.attr("role") === "button" || /\bbtn\b|\bbutton\b/i.test($el.attr("class") || "")) return;

    const text = $el.text().trim();
    if (text && CTA_TEXT_PATTERN.test(text)) {
      ctaCount++;
      ctaElements.push({ type: "action-link", text: text.substring(0, 60) });
    }
  });

  // ── 7. Page content snippet for AI layer ─────────────────────────────────
  const pageContent = truncateWords(bodyText, MAX_CONTENT_WORDS);

  // ── 8. Compose metrics object ─────────────────────────────────────────────
  const metrics = {
    url,
    metaTitle,
    metaDescription,
    wordCount,
    headings,
    links: { internal: internalLinks, external: externalLinks },
    images: {
      total: totalImages,
      missingAlt,
      missingAltPercent,
    },
    ctaCount,
    ctaElements: ctaElements.slice(0, 10), // show up to 10 examples
  };

  return { metrics, pageContent };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

async function fetchHtml(url) {
  try {
    const response = await axios.get(url, {
      timeout: FETCH_TIMEOUT_MS,
      maxRedirects: 5,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WebAuditBot/1.0; +https://github.com/audit-tool)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      // Only accept HTML responses
      validateStatus: (status) => status < 400,
    });

    const contentType = response.headers["content-type"] || "";
    if (!contentType.includes("text/html")) {
      throw new Error(`URL returned non-HTML content: ${contentType}`);
    }

    return response.data;
  } catch (err) {
    if (err.code === "ECONNREFUSED") throw new Error("Connection refused. Check the URL.");
    if (err.code === "ETIMEDOUT" || err.code === "ECONNABORTED") throw new Error("Request timed out. The page took too long to respond.");
    if (err.response?.status === 403) throw new Error("Access denied (403). The page blocks automated requests.");
    if (err.response?.status === 404) throw new Error("Page not found (404).");
    throw new Error(err.message || "Failed to fetch the page.");
  }
}
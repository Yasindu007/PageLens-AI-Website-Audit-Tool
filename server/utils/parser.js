// server/utils/parser.js

/**
 * Validate and normalize a URL string.
 * Returns { valid: true, url } or { valid: false, reason }.
 */
export function validateUrl(raw) {
  if (!raw || typeof raw !== "string") {
    return { valid: false, reason: "URL is required." };
  }

  let normalized = raw.trim();

  // Prepend https:// if no protocol given
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = "https://" + normalized;
  }

  try {
    const parsed = new URL(normalized);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, reason: "Only http and https URLs are supported." };
    }
    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return { valid: false, reason: "URL must have a valid hostname." };
    }
    return { valid: true, url: normalized };
  } catch {
    return { valid: false, reason: "Invalid URL format." };
  }
}

/**
 * Extract the base origin from a URL string (used to distinguish internal links).
 */
export function getOrigin(urlStr) {
  try {
    return new URL(urlStr).origin;
  } catch {
    return null;
  }
}

/**
 * Truncate text to a maximum number of words.
 */
export function truncateWords(text, maxWords = 1000) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "…";
}

/**
 * Count words in a string.
 */
export function countWords(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

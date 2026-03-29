// server/ai/logger.js
// ─────────────────────────────────────────────────────────────────────────────
// Appends each audit's prompt log to /logs/promptLogs.json for inspection.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_PATH = path.resolve(__dirname, "../../logs/promptLogs.json");

/**
 * Append a prompt log entry to the JSON log file.
 * Each log file is an array of entries.
 * @param {object} entry
 */
export async function appendPromptLog(entry) {
  let existing = [];

  try {
    const raw = await fs.readFile(LOG_PATH, "utf-8");
    existing = JSON.parse(raw);
    if (!Array.isArray(existing)) existing = [];
  } catch {
    // File doesn't exist yet — start fresh
  }

  existing.push(entry);

  // Keep last 50 entries to avoid unbounded growth
  if (existing.length > 50) {
    existing = existing.slice(-50);
  }

  await fs.writeFile(LOG_PATH, JSON.stringify(existing, null, 2), "utf-8");
}
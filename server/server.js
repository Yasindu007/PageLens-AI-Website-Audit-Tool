// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import auditRouter from "./routes/audit.js";
import { readPromptLogs } from "./ai/logger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
];
const allowedOrigins = process.env.CLIENT_ORIGINS
  ? process.env.CLIENT_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : DEFAULT_ALLOWED_ORIGINS;
const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === "true";

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (allowVercelPreviews && /^https:\/\/.*\.vercel\.app$/i.test(origin)) return true;
  return false;
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.set("trust proxy", 1);
app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
}));
app.use(express.json());

// Rate-limit: 20 audits per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests. Please wait before auditing again." },
});
app.use("/api", limiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/logs", async (_req, res, next) => {
  try {
    const logs = await readPromptLogs();
    res.json(logs);
  } catch (err) {
    next(err);
  }
});
app.use("/api", auditRouter);

// 404 catch-all
app.use((_req, res) => res.status(404).json({ error: "Route not found." }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[Server Error]", err);
  res.status(500).json({ error: err.message || "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`✅  Audit server running → http://localhost:${PORT}`);
});

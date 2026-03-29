// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import auditRouter from "./routes/audit.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:4173"] }));
app.use(express.json());

// Rate-limit: 20 audits per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests. Please wait before auditing again." },
});
app.use("/api", limiter);

// ── Routes ────────────────────────────────────────────────────────────────────
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
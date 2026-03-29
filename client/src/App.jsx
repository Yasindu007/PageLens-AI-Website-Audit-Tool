// client/src/App.jsx
import React, { useState } from "react";
import UrlForm from "./components/UrlForm.jsx";
import Metrics from "./components/Metrics.jsx";
import Insights from "./components/Insights.jsx";
import Recommendations from "./components/Recommendations.jsx";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-6 mt-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="section-card">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-paper-mid rounded-lg w-1/3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-20 bg-paper rounded-xl" />
              ))}
            </div>
            <div className="h-4 bg-paper-mid rounded w-2/3" />
            <div className="h-4 bg-paper-mid rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Error display ─────────────────────────────────────────────────────────────
function ErrorCard({ message, onReset }) {
  return (
    <div className="mt-8 section-card border-signal-red/20 bg-signal-redLight/20 animate-fade-up animate-fade-up-1">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-signal-redLight flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-body font-semibold text-signal-red mb-1">Audit Failed</h3>
          <p className="text-sm font-body text-ink/70 leading-relaxed">{message}</p>
          <button
            onClick={onReset}
            className="mt-3 text-sm font-body font-medium text-ink underline underline-offset-2 hover:no-underline"
          >
            Try again →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  const examples = [
    "https://stripe.com",
    "https://linear.app",
    "https://notion.so",
  ];

  return (
    <div className="mt-16 flex flex-col items-center text-center gap-6">
      {/* Decorative illustration */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-amber-pale" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e8a000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </div>
      </div>

      <div>
        <h2 className="font-display text-3xl text-ink mb-2">Audit any webpage</h2>
        <p className="font-body text-ink/50 text-sm max-w-sm leading-relaxed">
          Enter a URL above. We'll extract factual metrics, then use AI to generate
          grounded SEO, content, and UX insights.
        </p>
      </div>

      {/* What we analyze */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg w-full">
        {[
          ["📊", "Word count & headings"],
          ["🔗", "Internal / external links"],
          ["🖼", "Image alt text coverage"],
          ["🎯", "CTAs detected"],
          ["🏷", "Meta title & description"],
          ["🤖", "AI-powered insights"],
        ].map(([icon, text]) => (
          <div key={text} className="flex items-center gap-2 bg-white rounded-lg border border-paper-mid px-3 py-2 text-xs font-body text-ink/60">
            <span>{icon}</span>
            {text}
          </div>
        ))}
      </div>

      {/* Example URLs */}
      <div className="text-xs font-body text-ink/30">
        Try:{" "}
        {examples.map((ex, i) => (
          <React.Fragment key={ex}>
            <span className="font-mono">{ex}</span>
            {i < examples.length - 1 && <span className="mx-1">·</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleAudit(url) {
    setStatus("loading");
    setResult(null);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Audit failed. Please try again.");
      }

      setResult(data);
      setStatus("success");

      // Scroll to results
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setStatus("error");
    }
  }

  function handleReset() {
    setStatus("idle");
    setResult(null);
    setError("");
  }

  return (
    <div className="min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-paper/80 backdrop-blur-md border-b border-paper-mid">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f9f6f0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <span className="font-display text-lg text-ink">PageLens</span>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-paper-mid mx-1 hidden sm:block" />

          {/* Inline form in header once we have results */}
          <div className="flex-1">
            <UrlForm onSubmit={handleAudit} isLoading={status === "loading"} />
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero — only shown on idle */}
        {status === "idle" && (
          <div className="text-center pt-6 mb-6">
            <div className="inline-flex items-center gap-2 bg-amber-pale border border-amber-audit/20 text-amber-audit text-xs font-semibold px-3 py-1.5 rounded-full mb-4 font-body">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-audit inline-block" />
              AI-Powered · SEO + UX + Messaging
            </div>
            <h1 className="font-display text-4xl sm:text-5xl text-ink leading-tight mb-3">
              Website audit in
              <br />
              <em className="not-italic text-amber-audit">seconds.</em>
            </h1>
            <p className="font-body text-ink/50 text-base max-w-md mx-auto leading-relaxed">
              Real metrics. AI analysis grounded in data.
              No fluff, no generic advice.
            </p>
          </div>
        )}

        {/* Results area */}
        <div id="results">
          {status === "loading" && <LoadingSkeleton />}
          {status === "error" && <ErrorCard message={error} onReset={handleReset} />}
          {status === "success" && result && (
            <div className="space-y-6">
              <Metrics metrics={result.metrics} seoScore={result.seoScore} />
              <Insights insights={result.insights} provider={result.provider} />
              <Recommendations recommendations={result.recommendations} />

              {/* Re-audit button */}
              <div className="flex justify-center pt-2 pb-8">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-sm font-body text-ink/40 hover:text-ink transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10"/>
                    <path d="M3.51 15a9 9 0 1 0 .49-3.01"/>
                  </svg>
                  Audit another page
                </button>
              </div>
            </div>
          )}
          {status === "idle" && <EmptyState />}
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-paper-mid mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-body text-ink/25">
          <span>PageLens — AI Website Audit Tool</span>
          <span>Metrics are deterministic · Insights are AI-generated</span>
        </div>
      </footer>
    </div>
  );
}

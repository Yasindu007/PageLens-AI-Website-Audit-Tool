// client/src/components/Insights.jsx
import React, { useState } from "react";

const INSIGHT_CONFIG = {
  seo: {
    label: "SEO Structure",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    accent: "#1a7a4a",
    bg: "#d1f2e1",
  },
  messaging: {
    label: "Messaging Clarity",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    accent: "#7c3aed",
    bg: "#ede9fe",
  },
  cta: {
    label: "CTA Effectiveness",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 8 16 12 12 16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
    accent: "#e8a000",
    bg: "#fff4d6",
  },
  contentDepth: {
    label: "Content Depth",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    accent: "#0369a1",
    bg: "#e0f2fe",
  },
  ux: {
    label: "UX & Structure",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    ),
    accent: "#be185d",
    bg: "#fce7f3",
  },
};

function InsightCard({ insightKey, text }) {
  const [expanded, setExpanded] = useState(true);
  const config = INSIGHT_CONFIG[insightKey];

  return (
    <div
      className="rounded-xl border overflow-hidden transition-shadow hover:shadow-card"
      style={{ borderColor: config.accent + "30" }}
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors"
        style={{ backgroundColor: config.bg + "80" }}
      >
        <div className="flex items-center gap-2.5">
          <span style={{ color: config.accent }}>{config.icon}</span>
          <span className="font-body font-semibold text-sm text-ink">{config.label}</span>
        </div>
        <svg
          width="14" height="14"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          className={`text-ink/30 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Card body */}
      {expanded && (
        <div className="px-4 py-3 bg-white">
          <p className="text-sm font-body text-ink/80 leading-relaxed">{text}</p>
        </div>
      )}
    </div>
  );
}

export default function Insights({ insights, provider, model }) {
  return (
    <div className="section-card animate-fade-up animate-fade-up-2">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display text-2xl text-ink">AI Insights</h2>
          <p className="text-xs font-body text-ink/40 mt-1">
            Grounded in the extracted metrics above
          </p>
        </div>
        <span className="flex-shrink-0 inline-flex items-center gap-1.5 bg-ink text-paper text-[10px] font-mono font-medium px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-light inline-block" />
          {provider === "gemini" ? model || "Gemini" : provider === "openai" ? model || "OpenAI" : provider}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {Object.entries(insights).map(([key, text]) => (
          <InsightCard key={key} insightKey={key} text={text} />
        ))}
      </div>
    </div>
  );
}

// client/src/components/Recommendations.jsx
import React from "react";

const PRIORITY_CONFIG = {
  1: { label: "Critical", color: "#b91c1c", bg: "#fee2e2", dot: "#ef4444" },
  2: { label: "High",     color: "#b45309", bg: "#fef3c7", dot: "#f59e0b" },
  3: { label: "Medium",   color: "#0369a1", bg: "#e0f2fe", dot: "#38bdf8" },
  4: { label: "Low",      color: "#1a7a4a", bg: "#d1f2e1", dot: "#34d399" },
  5: { label: "Low",      color: "#1a7a4a", bg: "#d1f2e1", dot: "#34d399" },
};

function RecommendationCard({ rec, index }) {
  const p = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG[3];

  return (
    <div className="group flex gap-4 p-5 bg-white rounded-xl border border-paper-mid hover:shadow-card transition-shadow">
      {/* Priority indicator */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-display text-sm font-bold"
          style={{ backgroundColor: p.bg, color: p.color }}
        >
          {rec.priority}
        </div>
        {index < 4 && (
          <div className="w-px flex-1 min-h-[20px] rounded-full" style={{ backgroundColor: p.dot + "40" }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h3 className="font-body font-semibold text-sm text-ink">{rec.issue}</h3>
          <span
            className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ color: p.color, backgroundColor: p.bg }}
          >
            {p.label}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ink/30 mt-0.5 flex-shrink-0 pt-px">Why</span>
            <p className="text-sm font-body text-ink/60 leading-relaxed">{rec.reason}</p>
          </div>
          <div className="flex gap-2 items-start">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ink/30 flex-shrink-0 pt-px">Do</span>
            <p className="text-sm font-body text-ink font-medium leading-relaxed">{rec.action}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Recommendations({ recommendations }) {
  return (
    <div className="section-card animate-fade-up animate-fade-up-3">
      <div className="mb-5">
        <h2 className="font-display text-2xl text-ink">Recommendations</h2>
        <p className="text-xs font-body text-ink/40 mt-1">
          {recommendations.length} prioritized actions, ordered by impact
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {recommendations.map((rec, i) => (
          <RecommendationCard key={i} rec={rec} index={i} />
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-5 pt-4 border-t border-paper-mid flex items-center gap-2 text-xs font-body text-ink/30">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Recommendations are AI-generated and grounded in the metrics above. Always validate with your team.
      </div>
    </div>
  );
}
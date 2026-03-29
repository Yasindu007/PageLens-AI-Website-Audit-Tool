// client/src/components/Metrics.jsx
import React from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ≈ 339
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? "#1a7a4a" : score >= 50 ? "#b45309" : "#b91c1c";

  const label =
    score >= 75 ? "Good" : score >= 50 ? "Needs Work" : "Poor";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="#e8e0d0"
            strokeWidth="10"
          />
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-ring-animate"
            style={{ "--target-offset": offset }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl text-ink leading-none">{score}</span>
          <span className="text-[10px] font-body font-medium text-ink/50 uppercase tracking-widest mt-0.5">/ 100</span>
        </div>
      </div>
      <span
        className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
        style={{ color, backgroundColor: color + "18" }}
      >
        {label}
      </span>
    </div>
  );
}

function MetricCard({ icon, label, value, sub, status }) {
  const statusClasses = {
    good: "border-signal-green/20 bg-signal-greenLight/30",
    warn: "border-signal-yellow/20 bg-signal-yellowLight/30",
    bad: "border-signal-red/20 bg-signal-redLight/30",
    neutral: "border-paper-mid bg-paper/60",
  };

  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-2 transition-shadow hover:shadow-card ${
        statusClasses[status || "neutral"]
      }`}
    >
      <div className="flex items-center gap-2 text-ink/50">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-body font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-display text-2xl text-ink leading-tight">{value}</div>
      {sub && <div className="text-xs font-body text-ink/50">{sub}</div>}
    </div>
  );
}

function MetaRow({ label, value, status }) {
  const isEmpty = !value;
  const len = value ? value.length : 0;

  const lenStatus =
    label === "Meta Title"
      ? len >= 30 && len <= 60 ? "good" : len > 0 ? "warn" : "bad"
      : len >= 120 && len <= 160 ? "good" : len > 0 ? "warn" : "bad";

  return (
    <div className="flex flex-col gap-1.5 py-3 border-b border-paper-mid last:border-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-body font-semibold uppercase tracking-wider text-ink/50">{label}</span>
        {isEmpty ? (
          <span className="badge-red">Missing</span>
        ) : (
          <span className={lenStatus === "good" ? "badge-green" : "badge-yellow"}>
            {len} chars
          </span>
        )}
      </div>
      {isEmpty ? (
        <p className="text-sm font-body text-ink/30 italic">Not found</p>
      ) : (
        <p className="text-sm font-body text-ink leading-relaxed">{value}</p>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Metrics({ metrics, seoScore }) {
  const { wordCount, headings, links, images, ctaCount, metaTitle, metaDescription, url } = metrics;

  // Heading status
  const h1Status = headings.h1 === 1 ? "good" : headings.h1 === 0 ? "bad" : "warn";
  // Alt text
  const altStatus = images.missingAltPercent === 0 ? "good" : images.missingAltPercent < 50 ? "warn" : "bad";
  // Word count
  const wordStatus = wordCount >= 700 ? "good" : wordCount >= 300 ? "warn" : "bad";
  // CTA
  const ctaStatus = ctaCount >= 1 ? "good" : "bad";

  return (
    <div className="section-card animate-fade-up animate-fade-up-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl text-ink">Page Metrics</h2>
          <p className="text-xs font-body text-ink/40 mt-1 font-mono truncate max-w-xs">{url}</p>
        </div>
        <ScoreRing score={seoScore} />
      </div>

      {/* Meta tags */}
      <div className="bg-paper rounded-xl p-4 mb-6">
        <h3 className="text-xs font-body font-semibold uppercase tracking-widest text-ink/40 mb-3">Meta Tags</h3>
        <MetaRow label="Meta Title" value={metaTitle} />
        <MetaRow label="Meta Description" value={metaDescription} />
      </div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <MetricCard
          icon="📝"
          label="Word Count"
          value={wordCount.toLocaleString()}
          sub={wordCount < 300 ? "Too thin" : wordCount < 700 ? "Moderate" : "Substantial"}
          status={wordStatus}
        />
        <MetricCard
          icon="🏷"
          label="H1 Tags"
          value={headings.h1}
          sub={headings.h1 === 1 ? "Ideal" : headings.h1 === 0 ? "Missing!" : "Too many"}
          status={h1Status}
        />
        <MetricCard
          icon="📑"
          label="H2 / H3"
          value={`${headings.h2} / ${headings.h3}`}
          sub="Subheadings"
          status={headings.h2 > 0 ? "good" : "warn"}
        />
        <MetricCard
          icon="🎯"
          label="CTAs"
          value={ctaCount}
          sub={ctaCount === 0 ? "None detected" : "Detected"}
          status={ctaStatus}
        />
        <MetricCard
          icon="🔗"
          label="Internal Links"
          value={links.internal}
          sub="Same domain"
          status="neutral"
        />
        <MetricCard
          icon="↗"
          label="External Links"
          value={links.external}
          sub="Other domains"
          status="neutral"
        />
        <MetricCard
          icon="🖼"
          label="Images"
          value={images.total}
          sub={`${images.missingAlt} missing alt`}
          status={altStatus}
        />
        <MetricCard
          icon="♿"
          label="Missing Alt"
          value={`${images.missingAltPercent}%`}
          sub={images.missingAltPercent === 0 ? "All covered" : `${images.missingAlt} of ${images.total}`}
          status={altStatus}
        />
      </div>

      {/* CTA examples if any */}
      {metrics.ctaElements && metrics.ctaElements.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-body font-semibold uppercase tracking-widest text-ink/40 mb-2">
            Detected CTAs
          </h3>
          <div className="flex flex-wrap gap-2">
            {metrics.ctaElements.map((cta, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 bg-amber-pale border border-amber-audit/20 text-ink text-xs font-mono px-2.5 py-1 rounded-lg"
              >
                <span className="text-amber-audit text-[10px] uppercase font-semibold">{cta.type}</span>
                {cta.text}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
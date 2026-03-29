import React from "react";

function ScoreBadge({ score }) {
  const color =
    score >= 85 ? "#1a7a4a" : score >= 70 ? "#b45309" : "#b91c1c";
  const label =
    score >= 85 ? "Strong" : score >= 70 ? "Watchlist" : "At Risk";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-32 h-32 rounded-[2rem] border-4 flex flex-col items-center justify-center shadow-card"
        style={{ borderColor: color, color }}
      >
        <span className="font-display text-4xl leading-none">{score}</span>
        <span className="text-[10px] font-body font-semibold uppercase tracking-[0.22em] text-ink/50 mt-1">
          SEO Score
        </span>
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

function MetaRow({ label, value }) {
  const isEmpty = !value;
  const len = value ? value.length : 0;
  const lenStatus =
    label === "Meta Title"
      ? len >= 30 && len <= 60 ? "badge-green" : len > 0 ? "badge-yellow" : "badge-red"
      : len >= 120 && len <= 160 ? "badge-green" : len > 0 ? "badge-yellow" : "badge-red";

  return (
    <div className="flex flex-col gap-1.5 py-3 border-b border-paper-mid last:border-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-body font-semibold uppercase tracking-wider text-ink/50">{label}</span>
        {isEmpty ? (
          <span className="badge-red">Missing</span>
        ) : (
          <span className={lenStatus}>{len} chars</span>
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

function BreakdownSection({ breakdown }) {
  return (
    <div className="bg-white rounded-xl border border-paper-mid p-4">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-xs font-body font-semibold uppercase tracking-widest text-ink/40">
          Score Breakdown
        </h3>
        <span className="text-[11px] font-body text-ink/35">100 base score minus penalties</span>
      </div>

      {breakdown.length === 0 ? (
        <p className="text-sm font-body text-ink/60">No penalties were applied to the SEO score.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {breakdown.map((item, index) => (
            <div
              key={`${item.issue}-${index}`}
              className="flex items-center justify-between gap-3 rounded-lg bg-signal-redLight/18 border border-signal-red/10 px-3 py-2"
            >
              <span className="text-sm font-body text-ink">{item.issue}</span>
              <span className="text-sm font-semibold text-signal-red">{item.penalty}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Metrics({ metrics, seoScore, seoBreakdown }) {
  const { wordCount, headings, links, images, ctaCount, metaTitle, metaDescription, url } = metrics;
  const h1Status = headings.h1 === 1 ? "good" : headings.h1 === 0 ? "bad" : "warn";
  const altStatus = images.missingAltPercent === 0 ? "good" : images.missingAltPercent <= 50 ? "warn" : "bad";
  const ctaStatus = ctaCount > 50 ? "warn" : ctaCount >= 1 ? "good" : "bad";
  const wordStatus = wordCount >= 700 ? "good" : wordCount >= 300 ? "warn" : "bad";

  return (
    <div className="section-card animate-fade-up animate-fade-up-1">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
        <div>
          <h2 className="font-display text-2xl text-ink">Page Metrics</h2>
          <p className="text-xs font-body text-ink/40 mt-1 font-mono break-all">{url}</p>
        </div>
        <ScoreBadge score={seoScore} />
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4 mb-6">
        <div className="bg-paper rounded-xl p-4">
          <h3 className="text-xs font-body font-semibold uppercase tracking-widest text-ink/40 mb-3">Meta Tags</h3>
          <MetaRow label="Meta Title" value={metaTitle} />
          <MetaRow label="Meta Description" value={metaDescription} />
        </div>
        <BreakdownSection breakdown={seoBreakdown} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <MetricCard icon="Words" label="Word Count" value={wordCount.toLocaleString()} sub="Visible page copy" status={wordStatus} />
        <MetricCard icon="H1" label="H1 Tags" value={headings.h1} sub={headings.h1 === 1 ? "Ideal" : "Needs review"} status={h1Status} />
        <MetricCard icon="H2/H3" label="Headings" value={`${headings.h2} / ${headings.h3}`} sub="Hierarchy depth" status={headings.h2 > 0 ? "good" : "warn"} />
        <MetricCard icon="CTA" label="CTAs" value={ctaCount} sub={ctaCount > 50 ? "Crowded" : "Detected"} status={ctaStatus} />
        <MetricCard icon="INT" label="Internal Links" value={links.internal} sub="Same domain" status="neutral" />
        <MetricCard icon="EXT" label="External Links" value={links.external} sub="Other domains" status="neutral" />
        <MetricCard icon="IMG" label="Images" value={images.total} sub={`${images.missingAlt} missing alt`} status={altStatus} />
        <MetricCard icon="ALT" label="Missing Alt" value={`${images.missingAltPercent}%`} sub="Accessibility gap" status={altStatus} />
      </div>

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

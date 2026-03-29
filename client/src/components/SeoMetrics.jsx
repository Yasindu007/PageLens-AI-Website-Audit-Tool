import React from 'react';
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function SeoMetrics({ metrics }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <MetaSection metrics={metrics} />
      <HeadingsSection headings={metrics.headings} counts={metrics.headingCounts} />
      <LinksSection links={metrics.links} />
      <ImagesSection images={metrics.images} />
    </div>
  );
}

function MetaSection({ metrics }) {
  const items = [
    { label: 'Title', value: metrics.title, maxLen: 60 },
    { label: 'Meta Description', value: metrics.metaDescription, maxLen: 160 },
    { label: 'Canonical URL', value: metrics.canonicalUrl },
    { label: 'Robots', value: metrics.robots },
    { label: 'Viewport', value: metrics.viewport },
    { label: 'OG Title', value: metrics.ogTitle },
    { label: 'OG Description', value: metrics.ogDescription },
    { label: 'OG Image', value: metrics.ogImage },
  ];

  return (
    <Card title="Meta Tags">
      <div className="space-y-2">
        {items.map(({ label, value, maxLen }) => (
          <div key={label} className="flex gap-2 text-sm">
            {value ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <span className="text-gray-400">{label}: </span>
              {value ? (
                <span className={`text-gray-200 ${maxLen && value.length > maxLen ? 'text-yellow-400' : ''}`}>
                  {value.length > 80 ? value.substring(0, 80) + '…' : value}
                  {maxLen && value.length > maxLen && (
                    <span className="text-yellow-400 text-xs ml-1">({value.length} chars, max {maxLen})</span>
                  )}
                </span>
              ) : (
                <span className="text-red-400">Not set</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function HeadingsSection({ headings, counts }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card title="Headings Structure">
      <div className="grid grid-cols-3 gap-2 mb-4">
        {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((tag) => (
          <div key={tag} className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className={`text-xl font-bold ${counts[tag] === 0 && tag === 'h1' ? 'text-red-400' : counts[tag] > 1 && tag === 'h1' ? 'text-yellow-400' : 'text-violet-400'}`}>
              {counts[tag]}
            </div>
            <div className="text-xs text-gray-500 uppercase">{tag}</div>
          </div>
        ))}
      </div>
      {headings.h1.length > 0 && (
        <div>
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide' : 'Show'} H1 headings
          </button>
          {expanded && (
            <div className="mt-2 space-y-1">
              {headings.h1.map((h, i) => (
                <div key={i} className="text-sm text-gray-300 bg-gray-800/50 rounded px-3 py-1.5">{h}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function LinksSection({ links }) {
  const [showLinks, setShowLinks] = React.useState(false);

  return (
    <Card title="Links">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{links.internalCount}</div>
          <div className="text-xs text-gray-500">Internal</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-indigo-400">{links.externalCount}</div>
          <div className="text-xs text-gray-500">External</div>
        </div>
      </div>
      {(links.internalLinks.length > 0 || links.externalLinks.length > 0) && (
        <>
          <button onClick={() => setShowLinks(!showLinks)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300">
            {showLinks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showLinks ? 'Hide' : 'Show'} sample links
          </button>
          {showLinks && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {links.internalLinks.slice(0, 5).map((l, i) => (
                <div key={i} className="text-xs text-gray-400 bg-gray-800/50 rounded px-2 py-1 truncate">{l}</div>
              ))}
              {links.externalLinks.slice(0, 5).map((l, i) => (
                <div key={i} className="text-xs text-indigo-400/70 bg-gray-800/50 rounded px-2 py-1 truncate">{l}</div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function ImagesSection({ images }) {
  const altCoverage = images.total > 0
    ? Math.round((images.withAlt / images.total) * 100)
    : 100;

  return (
    <Card title="Images">
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-800/50 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-white">{images.total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-emerald-400">{images.withAlt}</div>
          <div className="text-xs text-gray-500">With Alt</div>
        </div>
        <div className={`bg-gray-800/50 rounded-xl p-3 text-center ${images.withoutAlt > 0 ? 'border border-red-500/20' : ''}`}>
          <div className={`text-xl font-bold ${images.withoutAlt > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{images.withoutAlt}</div>
          <div className="text-xs text-gray-500">No Alt</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Alt Coverage</span>
        <div className="flex-1 h-1.5 bg-gray-800 rounded-full">
          <div
            className={`h-full rounded-full ${altCoverage >= 80 ? 'bg-emerald-500' : altCoverage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${altCoverage}%` }}
          />
        </div>
        <span className="text-xs text-white font-semibold">{altCoverage}%</span>
      </div>
      {images.withoutAlt > 0 && (
        <div className="flex items-start gap-2 mt-3 p-2 bg-red-500/10 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-400">{images.withoutAlt} image(s) missing alt text — impacts accessibility and SEO.</p>
        </div>
      )}
    </Card>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}

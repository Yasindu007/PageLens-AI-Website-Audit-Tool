import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Clock, Globe } from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import SeoMetrics from './SeoMetrics';
import AiInsights from './AiInsights';
import CategoryScores from './CategoryScores';

export default function Dashboard({ result, onReset }) {
  const { url, metrics, analysis } = result;
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'seo', label: 'SEO Metrics' },
    { id: 'insights', label: 'AI Insights' },
  ];

  return (
    <div className="py-8">
      {/* Back button + URL */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          New Audit
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-300">
          <Globe className="w-4 h-4 text-gray-500" />
          <span className="max-w-xs truncate">{url}</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          {new Date(analysis.analyzedAt || metrics.scrapedAt).toLocaleTimeString()}
        </div>
      </div>

      {/* Score hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1 flex flex-col items-center justify-center bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <ScoreGauge score={analysis.overallScore} grade={analysis.grade} />
          <p className="text-center text-gray-400 text-sm mt-4 max-w-xs">{analysis.summary}</p>
        </div>
        <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Category Scores</h3>
          <CategoryScores scores={analysis.scores} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900/50 border border-gray-800 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickStats metrics={metrics} />
          <TopRecommendations recommendations={analysis.recommendations} />
        </div>
      )}
      {activeTab === 'seo' && <SeoMetrics metrics={metrics} />}
      {activeTab === 'insights' && <AiInsights analysis={analysis} />}
    </div>
  );
}

function QuickStats({ metrics }) {
  const stats = [
    { label: 'Word Count', value: metrics.wordCount.toLocaleString(), sub: 'words on page' },
    { label: 'Page Size', value: `${Math.round(metrics.pageSizeBytes / 1024)} KB`, sub: 'page weight' },
    { label: 'Internal Links', value: metrics.links.internalCount, sub: 'links found' },
    { label: 'External Links', value: metrics.links.externalCount, sub: 'links found' },
    { label: 'Images', value: metrics.images.total, sub: `${metrics.images.withoutAlt} without alt` },
    { label: 'H1 Tags', value: metrics.headingCounts.h1, sub: 'heading tags' },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Stats</h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, sub }) => (
          <div key={label} className="bg-gray-800/50 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs font-medium text-gray-300 mt-0.5">{label}</div>
            <div className="text-xs text-gray-500">{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopRecommendations({ recommendations = [] }) {
  const priorityColors = { high: 'text-red-400 bg-red-400/10', medium: 'text-yellow-400 bg-yellow-400/10', low: 'text-green-400 bg-green-400/10' };
  const top = recommendations.slice(0, 4);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Top Recommendations</h3>
      {top.length === 0 ? (
        <p className="text-gray-500 text-sm">No recommendations — great job!</p>
      ) : (
        <div className="space-y-3">
          {top.map((rec, i) => (
            <div key={i} className="flex gap-3 p-3 bg-gray-800/50 rounded-xl">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full h-fit mt-0.5 ${priorityColors[rec.priority]}`}>
                {rec.priority}
              </span>
              <div>
                <p className="text-sm text-gray-200">{rec.action}</p>
                <p className="text-xs text-gray-500 mt-0.5">{rec.impact}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

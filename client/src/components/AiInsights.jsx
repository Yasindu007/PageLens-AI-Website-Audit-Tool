import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, Lightbulb, TrendingUp } from 'lucide-react';

const severityConfig = {
  critical: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', badge: 'bg-red-400/10 text-red-400' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', badge: 'bg-yellow-400/10 text-yellow-400' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', badge: 'bg-blue-400/10 text-blue-400' },
  good: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', badge: 'bg-emerald-400/10 text-emerald-400' },
};

const priorityConfig = {
  high: { color: 'text-red-400', bg: 'bg-red-400/10' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  low: { color: 'text-green-400', bg: 'bg-green-400/10' },
};

export default function AiInsights({ analysis }) {
  const [filter, setFilter] = useState('all');

  const severities = ['all', 'critical', 'warning', 'info', 'good'];
  const filtered = filter === 'all'
    ? analysis.insights
    : analysis.insights.filter((i) => i.severity === filter);

  const counts = {
    critical: analysis.insights.filter((i) => i.severity === 'critical').length,
    warning: analysis.insights.filter((i) => i.severity === 'warning').length,
    info: analysis.insights.filter((i) => i.severity === 'info').length,
    good: analysis.insights.filter((i) => i.severity === 'good').length,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Insights */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Insights</h3>
          <span className="ml-auto text-xs text-gray-500">{analysis.insights.length} total</span>
        </div>

        {/* Severity filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {severities.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === s
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && counts[s] !== undefined && (
                <span className="ml-1 opacity-70">({counts[s]})</span>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No insights for this filter.</p>
          ) : (
            filtered.map((insight, i) => {
              const cfg = severityConfig[insight.severity] || severityConfig.info;
              const Icon = cfg.icon;
              return (
                <div key={i} className={`flex gap-3 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                  <Icon className={`w-4 h-4 ${cfg.color} flex-shrink-0 mt-0.5`} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${cfg.color}`}>{insight.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.badge}`}>{insight.category}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{insight.description}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recommendations</h3>
          <span className="ml-auto text-xs text-gray-500">{analysis.recommendations.length} actions</span>
        </div>
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {analysis.recommendations.length === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-emerald-400/10 rounded-xl">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <p className="text-sm text-emerald-400 font-medium">No major issues found — excellent work!</p>
            </div>
          ) : (
            analysis.recommendations.map((rec, i) => {
              const pcfg = priorityConfig[rec.priority] || priorityConfig.low;
              return (
                <div key={i} className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pcfg.bg} ${pcfg.color}`}>
                      {rec.priority} priority
                    </span>
                    <span className="text-xs text-gray-500">{rec.category}</span>
                  </div>
                  <p className="text-sm text-gray-200 font-medium">{rec.action}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="text-indigo-400">Impact: </span>{rec.impact}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

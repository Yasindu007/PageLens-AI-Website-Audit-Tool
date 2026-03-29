import React, { useState } from 'react';
import { Search, Globe, AlertCircle, ArrowRight, Shield, BarChart2, Lightbulb } from 'lucide-react';

const FEATURES = [
  { icon: BarChart2, label: 'SEO Metrics', desc: 'Title, meta tags, headings, word count' },
  { icon: Globe, label: 'Link Analysis', desc: 'Internal & external link mapping' },
  { icon: Shield, label: 'Image Audit', desc: 'Alt text coverage & accessibility' },
  { icon: Lightbulb, label: 'AI Insights', desc: 'Gemini-powered recommendations' },
];

export default function AuditForm({ onAudit, error }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) onAudit(url.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
          <span className="text-violet-400 text-sm font-medium">AI-Powered Website Analysis</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent leading-tight">
          Audit any website<br />in seconds
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Enter a URL to get a complete SEO analysis powered by Google Gemini AI —
          with actionable insights and a detailed score.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-4">
        <div className="flex gap-2 p-2 bg-gray-900 border border-gray-700 rounded-2xl focus-within:border-violet-500 transition-colors">
          <div className="flex items-center pl-3">
            <Globe className="w-5 h-5 text-gray-500" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 text-base px-2 py-2"
            autoFocus
          />
          <button
            type="submit"
            disabled={!url.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all duration-200 shadow-lg shadow-violet-500/25"
          >
            <Search className="w-4 h-4" />
            Audit
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-6 max-w-2xl w-full">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Feature pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 w-full max-w-2xl">
        {FEATURES.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex flex-col items-center text-center p-4 bg-gray-900/60 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors">
            <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center mb-2">
              <Icon className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-sm font-medium text-gray-200">{label}</span>
            <span className="text-xs text-gray-500 mt-0.5">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import React from 'react';

export default function LoadingSpinner({ url }) {
  const steps = [
    'Fetching page content...',
    'Extracting SEO metrics...',
    'Analyzing with AI...',
    'Generating insights...',
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>

      <h2 className="text-xl font-bold text-white mb-2">Auditing website…</h2>
      {url && (
        <p className="text-sm text-gray-400 mb-8 max-w-xs truncate" title={url}>
          {url}
        </p>
      )}

      <div className="space-y-3 w-full max-w-xs">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

import React from 'react';

const categories = [
  { key: 'title', label: 'Title Tag' },
  { key: 'metaTags', label: 'Meta Tags' },
  { key: 'headings', label: 'Headings' },
  { key: 'content', label: 'Content' },
  { key: 'links', label: 'Links' },
  { key: 'images', label: 'Images' },
  { key: 'technical', label: 'Technical' },
];

function getBarColor(score) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function CategoryScores({ scores = {} }) {
  return (
    <div className="space-y-3">
      {categories.map(({ key, label }) => {
        const score = Math.round(scores[key] ?? 0);
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-sm text-gray-400 w-24 flex-shrink-0">{label}</span>
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${getBarColor(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-white w-10 text-right">{score}</span>
          </div>
        );
      })}
    </div>
  );
}

import React from 'react';

const gradeColors = {
  A: { text: 'text-emerald-400', ring: 'stroke-emerald-400', bg: 'bg-emerald-400/10' },
  B: { text: 'text-blue-400', ring: 'stroke-blue-400', bg: 'bg-blue-400/10' },
  C: { text: 'text-yellow-400', ring: 'stroke-yellow-400', bg: 'bg-yellow-400/10' },
  D: { text: 'text-orange-400', ring: 'stroke-orange-400', bg: 'bg-orange-400/10' },
  F: { text: 'text-red-400', ring: 'stroke-red-400', bg: 'bg-red-400/10' },
};

export default function ScoreGauge({ score = 0, grade = 'F' }) {
  const colors = gradeColors[grade] || gradeColors['F'];
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#1f2937" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            className={colors.ring}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-extrabold ${colors.text}`}>{score}</span>
          <span className="text-gray-500 text-xs mt-0.5">/ 100</span>
        </div>
      </div>
      <div className={`mt-3 px-4 py-1.5 rounded-full text-lg font-bold ${colors.text} ${colors.bg}`}>
        Grade {grade}
      </div>
    </div>
  );
}

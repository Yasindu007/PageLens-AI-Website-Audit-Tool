export function calculateSeoScore(metrics) {
  let score = 100;
  const breakdown = [];

  if (metrics.images?.missingAltPercent > 50) {
    score -= 15;
    breakdown.push({ issue: "Missing alt text", penalty: -15 });
  }

  if ((metrics.headings?.h1 || 0) > 1) {
    score -= 5;
    breakdown.push({ issue: "Multiple H1 tags", penalty: -5 });
  }

  if ((metrics.ctaCount || 0) > 50) {
    score -= 5;
    breakdown.push({ issue: "Excessive CTA volume", penalty: -5 });
  }

  return {
    score: Math.max(0, score),
    breakdown,
  };
}

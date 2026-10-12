/**
 * Mirrors the issuer calculation in .github/workflows/certificate.yml so a
 * certificate can explain its existing result without changing that result.
 */
export const SCORE_MODEL = Object.freeze({
  weights: Object.freeze({ linesAdded: 0.5, linesRemoved: 0.4, commits: 0.1 }),
  caps: Object.freeze({ linesAdded: 290764.32, linesRemoved: 130211.56, commits: 536.52 }),
  outlierUpper: 17.980652793952775,
  thresholds: Object.freeze({ silver: 0.000818, gold: 0.006063 }),
});

const asNonNegativeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const normalize = (value, cap) => (cap > 0 ? clamp(value / cap) : 0);
const percentage = (value) => Math.round(clamp(value) * 100);
const labelForMetric = (value, unit) => `${value.toLocaleString()} ${unit}`;

export const getTierLabel = (tier) => {
  const normalized = String(tier || '').toLowerCase();
  if (normalized === 'gold') return 'Gold';
  if (normalized === 'silver') return 'Silver';
  if (normalized === 'bronze') return 'Bronze';
  return 'Unassigned';
};

export const buildScoreBreakdown = (certificate = {}) => {
  const stats = certificate.stats || {};
  const linesAdded = asNonNegativeNumber(stats.lines_added);
  const linesRemoved = asNonNegativeNumber(stats.lines_removed);
  const commits = asNonNegativeNumber(stats.merged_commits);
  const rawTotal = linesAdded + linesRemoved;
  const isExceptional = Math.log1p(rawTotal) > SCORE_MODEL.outlierUpper;

  const normalized = {
    linesAdded: normalize(linesAdded, SCORE_MODEL.caps.linesAdded),
    linesRemoved: normalize(linesRemoved, SCORE_MODEL.caps.linesRemoved),
    commits: normalize(commits, SCORE_MODEL.caps.commits),
  };
  const weighted = {
    linesAdded: normalized.linesAdded * SCORE_MODEL.weights.linesAdded,
    linesRemoved: normalized.linesRemoved * SCORE_MODEL.weights.linesRemoved,
    commits: normalized.commits * SCORE_MODEL.weights.commits,
  };

  const calculatedScore = weighted.linesAdded + weighted.linesRemoved + weighted.commits;
  const persistedScore = Number(certificate.score);
  const score = Number.isFinite(persistedScore) ? persistedScore : calculatedScore;
  const tier = getTierLabel(certificate.tier);
  const nextThreshold = tier === 'Bronze' ? SCORE_MODEL.thresholds.silver : SCORE_MODEL.thresholds.gold;
  const progress = tier === 'Gold' || isExceptional ? 1 : clamp(score / nextThreshold);
  const remaining = tier === 'Gold' || isExceptional ? 0 : Math.max(nextThreshold - score, 0);

  return {
    tier,
    score,
    calculatedScore,
    isExceptional,
    progress,
    remaining,
    nextTier: tier === 'Bronze' ? 'Silver' : tier === 'Silver' ? 'Gold' : null,
    totals: {
      linesAdded,
      linesRemoved,
      commits,
      projects: asNonNegativeNumber(stats.project_count),
    },
    normalized,
    weighted,
    metrics: [
      { key: 'linesAdded', label: 'Lines added', value: linesAdded, displayValue: labelForMetric(linesAdded, 'lines'), weight: SCORE_MODEL.weights.linesAdded, normalized: normalized.linesAdded, contribution: weighted.linesAdded, color: 'emerald' },
      { key: 'linesRemoved', label: 'Lines removed', value: linesRemoved, displayValue: labelForMetric(linesRemoved, 'lines'), weight: SCORE_MODEL.weights.linesRemoved, normalized: normalized.linesRemoved, contribution: weighted.linesRemoved, color: 'amber' },
      { key: 'commits', label: 'Verified commits', value: commits, displayValue: labelForMetric(commits, commits === 1 ? 'commit' : 'commits'), weight: SCORE_MODEL.weights.commits, normalized: normalized.commits, contribution: weighted.commits, color: 'violet' },
    ],
    formatted: {
      score: isExceptional ? 'Exceptional' : score.toFixed(6),
      progress: `${percentage(progress)}%`,
      remaining: remaining.toFixed(6),
    },
  };
};

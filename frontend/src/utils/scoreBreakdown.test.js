import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScoreBreakdown, getTierLabel, SCORE_MODEL } from './scoreBreakdown.js';

const certificate = (overrides = {}) => ({
  id: 42,
  tier: 'Silver',
  score: '0.003000',
  stats: {
    merged_commits: '12',
    lines_added: '1000',
    lines_removed: '400',
    project_count: '3',
  },
  ...overrides,
});

test('normalizes known tier names and handles unknown values safely', () => {
  assert.equal(getTierLabel('Gold'), 'Gold');
  assert.equal(getTierLabel('SILVER'), 'Silver');
  assert.equal(getTierLabel('bronze'), 'Bronze');
  assert.equal(getTierLabel(''), 'Unassigned');
  assert.equal(getTierLabel(null), 'Unassigned');
});

test('parses the persisted certificate metrics', () => {
  const result = buildScoreBreakdown(certificate());
  assert.deepEqual(result.totals, {
    linesAdded: 1000,
    linesRemoved: 400,
    commits: 12,
    projects: 3,
  });
  assert.equal(result.tier, 'Silver');
  assert.equal(result.score, 0.003);
  assert.equal(result.formatted.score, '0.003000');
});

test('uses the issuer weights for normalized contributions', () => {
  const result = buildScoreBreakdown(certificate({ score: undefined }));
  assert.equal(result.normalized.linesAdded, 1000 / SCORE_MODEL.caps.linesAdded);
  assert.equal(result.normalized.linesRemoved, 400 / SCORE_MODEL.caps.linesRemoved);
  assert.equal(result.normalized.commits, 12 / SCORE_MODEL.caps.commits);
  assert.equal(result.weighted.linesAdded, result.normalized.linesAdded * 0.5);
  assert.equal(result.weighted.linesRemoved, result.normalized.linesRemoved * 0.4);
  assert.equal(result.weighted.commits, result.normalized.commits * 0.1);
  assert.equal(result.score, result.calculatedScore);
});

test('prefers the issuer score when it is present', () => {
  const result = buildScoreBreakdown(certificate({ score: '0.123456' }));
  assert.equal(result.score, 0.123456);
  assert.notEqual(result.score, result.calculatedScore);
});

test('falls back to calculated score for a missing or invalid persisted value', () => {
  const missing = buildScoreBreakdown(certificate({ score: undefined }));
  const invalid = buildScoreBreakdown(certificate({ score: 'not-a-number' }));
  assert.equal(missing.score, missing.calculatedScore);
  assert.equal(invalid.score, invalid.calculatedScore);
});

test('clamps each metric at the model cap', () => {
  const result = buildScoreBreakdown(certificate({
    score: undefined,
    stats: {
      lines_added: SCORE_MODEL.caps.linesAdded * 3,
      lines_removed: SCORE_MODEL.caps.linesRemoved * 3,
      merged_commits: SCORE_MODEL.caps.commits * 3,
    },
  }));
  assert.deepEqual(result.normalized, { linesAdded: 1, linesRemoved: 1, commits: 1 });
  assert.equal(result.calculatedScore, 1);
});

test('converts negative, empty, and malformed values to zero', () => {
  const result = buildScoreBreakdown({
    tier: 'Bronze',
    stats: {
      lines_added: '-10',
      lines_removed: 'unknown',
      merged_commits: '',
      project_count: null,
    },
  });
  assert.deepEqual(result.totals, { linesAdded: 0, linesRemoved: 0, commits: 0, projects: 0 });
  assert.equal(result.calculatedScore, 0);
  assert.equal(result.formatted.progress, '0%');
});

test('calculates Bronze progress toward Silver', () => {
  const result = buildScoreBreakdown(certificate({ tier: 'Bronze', score: '0.000409' }));
  assert.equal(result.nextTier, 'Silver');
  assert.equal(result.formatted.progress, '50%');
  assert.equal(result.remaining, SCORE_MODEL.thresholds.silver - 0.000409);
});

test('calculates Silver progress toward Gold', () => {
  const result = buildScoreBreakdown(certificate({ tier: 'Silver', score: '0.0030315' }));
  assert.equal(result.nextTier, 'Gold');
  assert.equal(result.formatted.progress, '50%');
});

test('marks Gold as complete', () => {
  const result = buildScoreBreakdown(certificate({ tier: 'Gold', score: '0.006063' }));
  assert.equal(result.nextTier, null);
  assert.equal(result.formatted.progress, '100%');
  assert.equal(result.remaining, 0);
});

test('uses the workflow exceptional-volume shortcut', () => {
  const rawTotal = Math.exp(SCORE_MODEL.outlierUpper) + 1;
  const result = buildScoreBreakdown(certificate({
    tier: 'Gold',
    score: 'Exceptional',
    stats: { lines_added: String(rawTotal), lines_removed: '0', merged_commits: '1', project_count: '1' },
  }));
  assert.equal(result.isExceptional, true);
  assert.equal(result.formatted.score, 'Exceptional');
  assert.equal(result.formatted.progress, '100%');
});

test('does not mark a value at the outlier boundary as exceptional', () => {
  const rawTotal = Math.exp(SCORE_MODEL.outlierUpper) - 1;
  const result = buildScoreBreakdown(certificate({
    tier: 'Silver',
    score: undefined,
    stats: { lines_added: String(rawTotal), lines_removed: '0', merged_commits: '1', project_count: '1' },
  }));
  assert.equal(result.isExceptional, false);
});

test('returns three explainable metric rows in the issuer order', () => {
  const result = buildScoreBreakdown(certificate());
  assert.deepEqual(result.metrics.map(({ key }) => key), ['linesAdded', 'linesRemoved', 'commits']);
  assert.deepEqual(result.metrics.map(({ weight }) => weight), [0.5, 0.4, 0.1]);
});

test('handles an empty certificate record without throwing', () => {
  const result = buildScoreBreakdown();
  assert.equal(result.tier, 'Unassigned');
  assert.deepEqual(result.totals, { linesAdded: 0, linesRemoved: 0, commits: 0, projects: 0 });
  assert.equal(result.formatted.score, '0.000000');
});

import React, { useMemo, useState } from 'react';
import { BarChart3, ChevronDown, Gauge, HelpCircle, Info, Sparkles } from 'lucide-react';
import { buildScoreBreakdown, SCORE_MODEL } from '../utils/scoreBreakdown';

const COLOR_STYLES = {
  emerald: { text: 'text-emerald-300', bar: 'bg-emerald-400', track: 'bg-emerald-400/10' },
  amber: { text: 'text-amber-300', bar: 'bg-amber-400', track: 'bg-amber-400/10' },
  violet: { text: 'text-violet-300', bar: 'bg-violet-400', track: 'bg-violet-400/10' },
};

const MetricRow = ({ metric }) => {
  const styles = COLOR_STYLES[metric.color] || COLOR_STYLES.violet;
  const normalizedPercent = Math.round(metric.normalized * 100);
  return (
    <div className="space-y-2" data-testid={`score-metric-${metric.key}`}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="min-w-0">
          <span className="font-semibold text-zinc-200">{metric.label}</span>
          <span className="ml-2 text-zinc-500">{metric.displayValue}</span>
        </div>
        <span className={`shrink-0 font-mono ${styles.text}`}>{Math.round(metric.weight * 100)}% weight</span>
      </div>
      <div className={`h-2 overflow-hidden rounded-full ${styles.track}`}>
        <div
          className={`h-full rounded-full ${styles.bar} transition-[width] duration-700`}
          style={{ width: `${normalizedPercent}%` }}
          role="progressbar"
          aria-label={`${metric.label} normalized contribution`}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={normalizedPercent}
        />
      </div>
      <p className="text-right text-[11px] text-zinc-500">Adds {metric.contribution.toFixed(6)} to the score</p>
    </div>
  );
};

const ThresholdRow = ({ label, value, active }) => (
  <div className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${active ? 'border-indigo-400/40 bg-indigo-400/10 text-white' : 'border-white/[0.06] bg-black/20 text-zinc-400'}`}>
    <span>{label}</span>
    <span className="font-mono">{value.toFixed(6)}</span>
  </div>
);

const ScoreBreakdown = ({ certificate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const breakdown = useMemo(() => buildScoreBreakdown(certificate), [certificate]);
  const { tier, totals, formatted } = breakdown;

  return (
    <section className="mt-1 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] shadow-[0_8px_32px_rgba(0,0,0,0.25)]" aria-labelledby="score-breakdown-title">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        aria-expanded={isOpen}
        aria-controls="score-breakdown-content"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300"><BarChart3 className="h-4 w-4" /></span>
          <span className="min-w-0">
            <span id="score-breakdown-title" className="block text-[11px] font-bold uppercase tracking-widest text-zinc-400">How this tier was calculated</span>
            <span className="mt-1 block truncate text-sm text-zinc-200">{tier} · score {formatted.score}</span>
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div id="score-breakdown-content" className="space-y-5 border-t border-white/[0.06] px-5 pb-5 pt-4" data-testid="score-breakdown-content">
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3"><span className="block text-zinc-500">Commits</span><strong className="mt-1 block text-zinc-100">{totals.commits.toLocaleString()}</strong></div>
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3"><span className="block text-zinc-500">Added</span><strong className="mt-1 block text-zinc-100">{totals.linesAdded.toLocaleString()}</strong></div>
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3"><span className="block text-zinc-500">Removed</span><strong className="mt-1 block text-zinc-100">{totals.linesRemoved.toLocaleString()}</strong></div>
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3"><span className="block text-zinc-500">Projects</span><strong className="mt-1 block text-zinc-100">{totals.projects.toLocaleString()}</strong></div>
          </div>

          <div className="space-y-4">{breakdown.metrics.map((metric) => <MetricRow key={metric.key} metric={metric} />)}</div>

          <div className="rounded-xl border border-indigo-400/10 bg-indigo-400/[0.04] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-200"><Gauge className="h-4 w-4" /> Next tier progress</div>
            <div className="mb-2 flex items-center justify-between text-xs"><span className="text-zinc-400">{tier === 'Gold' ? 'Highest tier reached' : `Progress toward ${breakdown.nextTier}`}</span><span className="font-semibold text-white">{formatted.progress}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-black/40"><div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400" style={{ width: formatted.progress }} /></div>
            {tier !== 'Gold' && <p className="mt-2 text-[11px] text-zinc-500">The remaining score gap is {formatted.remaining}.</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400"><HelpCircle className="h-4 w-4" /> Tier thresholds</div>
            <ThresholdRow label="Silver" value={SCORE_MODEL.thresholds.silver} active={tier === 'Silver'} />
            <ThresholdRow label="Gold" value={SCORE_MODEL.thresholds.gold} active={tier === 'Gold'} />
          </div>

          <div className="flex gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3 text-[11px] leading-relaxed text-zinc-500"><Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" /><p>Scores use the same issuer model as the certificate workflow: lines added (50%), lines removed (40%), and verified commits (10%). Values are capped and normalized so unusually large changes do not dominate the result.</p></div>
          {breakdown.isExceptional && <div className="flex items-center gap-2 text-xs font-semibold text-fuchsia-300"><Sparkles className="h-4 w-4" /> Exceptional contribution volume qualified this certificate for Gold.</div>}
        </div>
      )}
    </section>
  );
};

export default ScoreBreakdown;

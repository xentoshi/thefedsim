'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { ActionResult, SimplePolicyAction, GameState } from '@/engine/types'
import { getHistoricalParallel } from '@/engine/regimes'

type Props = {
  result: ActionResult
  action: SimplePolicyAction
  prevState: GameState
  onDismiss: () => void
  onPressConference?: () => void
}

// ─── Human-language consequences ────────────────────────────────────────────

function getConsequence(action: SimplePolicyAction, prev: GameState, next: GameState): string {
  const infDelta  = next.macro.coreInflation   - prev.macro.coreInflation
  const unempDelta = next.macro.unemploymentRate - prev.macro.unemploymentRate
  const credDelta  = next.credibility.overallScore - prev.credibility.overallScore

  switch (action) {
    case 'raise':
      if (infDelta < -0.1)
        return `Your rate hike is working — inflation fell. Borrowing costs are up across the economy. Watch unemployment over the next few meetings.`
      if (unempDelta > 0.2)
        return `Rates went up and the job market felt it. Inflation may cool, but you're making it harder for businesses to hire. Classic tradeoff.`
      return `Rates raised. Markets are digesting it. The real effect on inflation takes 12–18 months — monetary policy is slow medicine.`

    case 'cut':
      if (unempDelta < -0.1)
        return `The cut worked — cheaper borrowing is spurring hiring. Keep an eye on inflation; it can reignite faster than it fell.`
      if (infDelta > 0.1)
        return `Growth is picking up but inflation is creeping back. Cutting too deep, too fast risks repeating the 1970s mistake.`
      return `Rate cut in place. Cheaper money flows through the system — mortgages, business loans, credit cards. Growth should follow.`

    case 'hold':
      if (credDelta > 0)
        return `Holding steady signaled confidence. Markets read patience as strength — credibility ticked up. Sometimes the right move is no move.`
      if (credDelta < -2)
        return `The committee held but markets wanted action. Inaction can be misread as complacency. Forward guidance matters here.`
      return `Held rates. You're signaling that you trust the current path. Every hold is a statement: "We're watching, and we're not panicking."`

    case 'qe':
      return `You opened the balance sheet. Buying bonds injects liquidity — credit loosens, confidence returns. This is the Fed's emergency lever. Use it wisely or it feeds inflation.`

    case 'qt':
      return `Balance sheet shrinking. You're draining liquidity from the system — a slow, deliberate brake on money supply. Less dramatic than a rate hike, but equally powerful over time.`
  }
}

// ─── Next meeting forward hook ───────────────────────────────────────────────

const HOOKS = [
  'Jobs report drops before the next meeting. Markets will price it in first.',
  'Inflation expectations data is due. If they drift up, you\'ll face harder choices.',
  'Two committee members are signaling dissent. The next vote may not be unanimous.',
  'The bond market is pricing in a different path than you. One of you is wrong.',
  'GDP revision coming. Better or worse than expected will move your hand.',
  'Housing data next week. Rates affect mortgages — you\'ll see it before markets do.',
  'Oil prices are moving. If they spike, your inflation math changes overnight.',
  'Congressional testimony scheduled. Stay consistent — contradictions cost credibility.',
  'The dollar is strengthening. Good for imports, bad for exports. Watch carefully.',
  'Consumer confidence data due. The public\'s mood affects the economy it measures.',
]

function getHook(turn: number): string {
  return HOOKS[turn % HOOKS.length]
}

// ─── Metric delta row ────────────────────────────────────────────────────────

function Delta({ label, prev, next, format, goodDir }: {
  label: string; prev: number; next: number
  format: 'percent' | 'number'; goodDir: 'up' | 'down'
}) {
  const diff = next - prev
  const isGood = Math.abs(diff) < 0.005 ? null : goodDir === 'up' ? diff > 0 : diff < 0
  const color = isGood === null ? 'var(--g-txt-3)' : isGood ? 'var(--g-up)' : 'var(--g-down)'
  const arrow = diff > 0.005 ? '▲' : diff < -0.005 ? '▼' : '—'
  const fmt = (v: number) => format === 'percent' ? `${v.toFixed(2)}%` : v.toFixed(1)

  return (
    <motion.div className="flex items-center justify-between py-1.5"
      style={{ borderBottom: '1px solid var(--g-border)' }}
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
      <span className="g-label">{label}</span>
      <div className="flex items-center gap-2">
        <span className="g-caption tabular-nums">{fmt(prev)}</span>
        <span className="text-xs font-bold font-mono tabular-nums" style={{ color }}>
          {arrow} {fmt(next)}
        </span>
      </div>
    </motion.div>
  )
}

// ─── Action metadata ─────────────────────────────────────────────────────────

const ACTION_META: Record<SimplePolicyAction, { label: string; color: string; icon: string }> = {
  raise: { label: 'Rates Raised +25bps', color: '#ef4444', icon: '📈' },
  cut:   { label: 'Rates Cut −25bps',    color: '#10b981', icon: '📉' },
  hold:  { label: 'Rates Held',          color: '#a1a1aa', icon: '⏸' },
  qe:    { label: 'QE Activated',        color: '#3b82f6', icon: '💵' },
  qt:    { label: 'QT Activated',        color: '#f97316', icon: '🏦' },
}

// ─── Main component ──────────────────────────────────────────────────────────

export function TurnResolutionCard({ result, action, prevState, onDismiss, onPressConference }: Props) {
  const meta = ACTION_META[action]
  const next = result.newState
  const scoreDelta = next.score.overall - prevState.score.overall
  const consequence = getConsequence(action, prevState, next)
  const hook = getHook(next.turn)
  const parallel = getHistoricalParallel(next)

  // FOMC statement from last meeting if available
  const meeting = result.fomcReaction

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onDismiss}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        <motion.div
          className="relative w-full max-w-md mx-4 rounded-sm overflow-hidden"
          initial={{ scale: 0.9, y: 32 }} animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.93, y: 20 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--g-surface)',
            border: `1px solid ${meta.color}30`,
            boxShadow: `0 0 48px ${meta.color}20, 0 24px 64px rgba(0,0,0,0.9)`,
          }}
        >
          {/* Color bar */}
          <div className="h-0.5 w-full" style={{ background: meta.color }} />

          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--g-border)' }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{meta.icon}</span>
              <div>
                <div className="g-label mb-0.5">Meeting {next.turn} — Decision</div>
                <div className="text-base font-black" style={{ fontFamily: 'var(--g-font-display)', color: meta.color }}>
                  {meta.label}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="g-label mb-0.5">Score</div>
              <motion.div className="text-lg font-black" style={{ fontFamily: 'var(--g-font-display)', color: scoreDelta >= 0 ? 'var(--g-up)' : 'var(--g-down)' }}
                initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
                {scoreDelta >= 0 ? '+' : ''}{scoreDelta.toFixed(1)}
              </motion.div>
            </div>
          </div>

          {/* Human consequence */}
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--g-border)' }}>
            <div className="g-label mb-2">What happened</div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--g-txt-2)', fontFamily: 'var(--g-font-data)' }}>
              {consequence}
            </p>
          </div>

          {/* FOMC statement snippet */}
          {meeting?.statement && (
            <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--g-border)', background: 'var(--g-raised)' }}>
              <div className="g-label mb-1.5">FOMC Statement</div>
              <p className="text-xs italic leading-relaxed" style={{ color: 'var(--g-txt-3)' }}>
                &ldquo;{meeting.statement.slice(0, 180)}{meeting.statement.length > 180 ? '…' : ''}&rdquo;
              </p>
            </div>
          )}

          {/* Metric deltas */}
          <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--g-border)' }}>
            <div className="g-label mb-2">Market Response</div>
            <Delta label="Core Inflation"  prev={prevState.macro.coreInflation}    next={next.macro.coreInflation}    format="percent" goodDir="down" />
            <Delta label="Unemployment"    prev={prevState.macro.unemploymentRate}  next={next.macro.unemploymentRate}  format="percent" goodDir="down" />
            <Delta label="GDP Growth"      prev={prevState.macro.gdpGrowth}         next={next.macro.gdpGrowth}         format="percent" goodDir="up" />
            <Delta label="Fed Funds Rate"  prev={prevState.financial.fedFundsRate}  next={next.financial.fedFundsRate}  format="percent" goodDir="up" />
            <Delta label="Credibility"     prev={prevState.credibility.overallScore} next={next.credibility.overallScore} format="number" goodDir="up" />
          </div>

          {/* Active events */}
          {result.events.length > 0 && (
            <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--g-border)' }}>
              {result.events.slice(0, 2).map((ev, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 * i }}
                  className="flex items-start gap-2 text-xs py-1" style={{ color: 'var(--g-warn)' }}>
                  <span className="flex-shrink-0">⚡</span>
                  <span style={{ fontFamily: 'var(--g-font-data)' }}>{ev.name} — {ev.headline}</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Historical parallel */}
          <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--g-border)', background: 'var(--g-raised)' }}>
            <div className="g-label mb-1.5" style={{ color: 'var(--g-warn)' }}>Historical Parallel</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs font-black" style={{ color: 'var(--g-txt-1)', fontFamily: 'var(--g-font-data)' }}>{parallel.period}</span>
              <span className="text-[10px] font-bold" style={{ color: 'var(--g-warn)' }}>{parallel.headline}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--g-txt-3)', fontFamily: 'var(--g-font-data)' }}>
              {parallel.detail}
            </p>
          </div>

          {/* Next meeting hook */}
          <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--g-border)' }}>
            <div className="g-label mb-1.5" style={{ color: 'var(--g-brand)' }}>Before the next meeting</div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--g-txt-3)', fontFamily: 'var(--g-font-data)' }}>
              {hook}
            </p>
          </div>

          <div className="px-5 py-3 flex items-center justify-between gap-3">
            {onPressConference && (
              <button
                onClick={(e) => { e.stopPropagation(); onPressConference() }}
                className="text-xs font-bold py-1.5 px-3 rounded-sm transition-all hover:brightness-110"
                style={{ background: 'rgba(41,98,255,0.1)', color: 'var(--g-brand)', border: '1px solid rgba(41,98,255,0.25)', fontFamily: 'var(--g-font-data)' }}
              >
                🎙 Press Conference
              </button>
            )}
            <span className="g-label ml-auto" style={{ color: 'var(--g-border-bright)' }}>Click anywhere to continue</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

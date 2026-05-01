'use client'

import { motion } from 'framer-motion'
import type { GameState } from '@/engine/types'

type Props = { state: GameState }

// Standard Taylor Rule: r = r* + π + 0.5(π - π*) + 0.5 × outputGap
// r* = neutral real rate (2%), π* = inflation target (2%)
function taylorRate(state: GameState): number {
  const rStar   = 2.0
  const piStar  = 2.0
  const pi      = state.macro.coreInflation
  const gap     = state.macro.outputGap
  return rStar + pi + 0.5 * (pi - piStar) + 0.5 * gap
}

export function TaylorRule({ state }: Props) {
  const recommended = taylorRate(state)
  const actual      = state.financial.fedFundsRate
  const delta       = actual - recommended
  const absDelta    = Math.abs(delta)

  const stance =
    absDelta < 0.25 ? { label: 'On Rule', color: 'var(--g-up)' }
    : delta > 0     ? { label: 'Too Hawkish', color: 'var(--g-warn)' }
    :                 { label: 'Too Dovish', color: 'var(--g-info)' }

  const pct = Math.min(100, (absDelta / 3) * 100) // 3% max delta for full bar

  return (
    <div className="g-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="g-label">Taylor Rule</span>
        <span className="g-label" style={{ color: stance.color }}>{stance.label}</span>
      </div>

      {/* Recommended vs actual */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <div className="g-label mb-0.5">Rule Says</div>
          <span className="text-lg font-black tabular-nums" style={{ fontFamily: 'var(--g-font-display)', color: 'var(--g-txt-1)' }}>
            {recommended.toFixed(2)}%
          </span>
        </div>
        <div className="text-right">
          <div className="g-label mb-0.5">Actual</div>
          <span className="text-lg font-black tabular-nums" style={{ fontFamily: 'var(--g-font-display)', color: stance.color }}>
            {actual.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Deviation bar */}
      <div className="relative h-1.5 rounded-sm overflow-hidden mb-2" style={{ background: 'var(--g-raised)' }}>
        <motion.div
          className="absolute top-0 h-full rounded-sm"
          style={{
            background: stance.color,
            width: `${pct}%`,
            left: delta > 0 ? '50%' : `${50 - pct / 2}%`,
          }}
          animate={{ width: `${pct / 2}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        />
        {/* Center line */}
        <div className="absolute top-0 bottom-0 w-px bg-[var(--g-border-bright)]" style={{ left: '50%' }} />
      </div>

      <p className="text-[10px] leading-relaxed" style={{ color: 'var(--g-txt-3)', fontFamily: 'var(--g-font-data)' }}>
        {delta > 0.25
          ? `You're ${delta.toFixed(2)}% above the rule — tighter than the model suggests.`
          : delta < -0.25
          ? `You're ${absDelta.toFixed(2)}% below the rule — looser than the model suggests.`
          : 'Your rate is close to the Taylor Rule recommendation.'}
      </p>
    </div>
  )
}

// Export the raw calculation for use in chart reference lines
export { taylorRate }

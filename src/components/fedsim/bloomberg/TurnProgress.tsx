'use client'

import { motion } from 'framer-motion'

type Props = {
  currentTurn: number
  maxTurns: number
  status: 'playing' | 'won' | 'lost' | 'paused'
  scenarioName?: string
}

export function TurnProgress({ currentTurn, maxTurns, status, scenarioName }: Props) {
  const progress = (currentTurn / maxTurns) * 100
  const remaining = maxTurns - currentTurn

  const statusEl = {
    playing: <span className="flex items-center gap-1" style={{ color: 'var(--g-up)' }}><span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />LIVE</span>,
    won:     <span style={{ color: 'var(--g-up)' }}>✓ COMPLETE</span>,
    lost:    <span style={{ color: 'var(--g-down)' }}>✕ FAILED</span>,
    paused:  <span style={{ color: 'var(--g-warn)' }}>⏸ PAUSED</span>,
  }[status]

  const barColor = progress < 33 ? 'var(--g-up)' : progress < 66 ? 'var(--g-warn)' : 'var(--g-brand)'

  return (
    <div className="g-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="g-label">{scenarioName ?? 'Sandbox Mode'}</span>
        <span className="g-label">{statusEl}</span>
      </div>

      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-2xl font-black tabular-nums" style={{ fontFamily: 'var(--g-font-display)', color: 'var(--g-txt-1)' }}>
          {currentTurn}
        </span>
        <span className="g-caption">/ {maxTurns} turns</span>
      </div>

      <div className="h-1.5 rounded-sm overflow-hidden" style={{ background: 'var(--g-raised)' }}>
        <motion.div
          className="h-full rounded-sm"
          style={{ background: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {remaining <= 5 && status === 'playing' && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="g-label mt-2" style={{ color: 'var(--g-warn)' }}>
          ⚡ {remaining} meeting{remaining !== 1 ? 's' : ''} remaining
        </motion.p>
      )}
    </div>
  )
}

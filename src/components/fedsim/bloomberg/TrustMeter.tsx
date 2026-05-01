'use client'

import { motion } from 'framer-motion'

type Props = { value: number; max?: number }

function getState(pct: number) {
  if (pct > 60) return { color: 'var(--g-up)',   label: 'STABLE'   }
  if (pct > 35) return { color: 'var(--g-warn)',  label: 'WARNING'  }
  return              { color: 'var(--g-down)',   label: 'CRITICAL' }
}

export function TrustMeter({ value, max = 100 }: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const { color, label } = getState(pct)

  return (
    <div className="g-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="g-label">Fed Credibility</span>
        <span className="g-label" style={{ color }}>{label}</span>
      </div>

      <div className="relative h-2 rounded-sm overflow-hidden mb-2" style={{ background: 'var(--g-raised)', border: '1px solid var(--g-border)' }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-sm"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        />
        {[25, 50, 75].map(t => (
          <div key={t} className="absolute top-0 bottom-0 w-px" style={{ left: `${t}%`, background: 'var(--g-border)' }} />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-lg font-black tabular-nums" style={{ fontFamily: 'var(--g-font-display)', color }}>{Math.round(value)}</span>
        <span className="g-label">/ {max}</span>
      </div>
    </div>
  )
}

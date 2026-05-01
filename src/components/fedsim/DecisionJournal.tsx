'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GameState } from '@/engine/types'

type Props = { state: GameState }

const ACTION_META: Record<string, { label: string; color: string }> = {
  raise: { label: 'RAISE',  color: 'var(--g-down)' },
  cut:   { label: 'CUT',    color: 'var(--g-up)'   },
  hold:  { label: 'HOLD',   color: 'var(--g-txt-3)' },
  qe:    { label: 'QE',     color: 'var(--g-info)'  },
  qt:    { label: 'QT',     color: 'var(--g-warn)'  },
}

function actionKey(action: unknown): string {
  if (typeof action === 'string') return action
  if (action && typeof action === 'object' && 'type' in action) {
    const a = action as { type: string; direction?: string; operation?: string }
    if (a.type === 'rate') return a.direction ?? 'hold'
    if (a.type === 'balance_sheet') return a.operation ?? 'hold'
  }
  return 'hold'
}

export function DecisionJournal({ state }: Props) {
  const [open, setOpen] = useState(false)

  const entries = state.actionHistory.map((a, i) => {
    const before = state.history[i - 1] ?? null
    const after  = state.history[i] ?? null
    const key    = actionKey(a.action)
    const meta   = ACTION_META[key] ?? ACTION_META.hold

    return {
      turn:   a.turn,
      key,
      meta,
      infBefore: before?.macro.coreInflation,
      infAfter:  after?.macro.coreInflation,
      unempBefore: before?.macro.unemploymentRate,
      unempAfter:  after?.macro.unemploymentRate,
      rate: after?.financial.fedFundsRate ?? state.financial.fedFundsRate,
    }
  }).reverse() // newest first

  if (entries.length === 0) return null

  return (
    <div className="g-panel overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full g-panel-header flex items-center justify-between hover:brightness-110 transition-all"
        style={{ cursor: 'pointer' }}
      >
        <span>Decision Journal</span>
        <div className="flex items-center gap-2">
          <span className="g-label" style={{ color: 'var(--g-brand)' }}>{entries.length} decisions</span>
          <span style={{ color: 'var(--g-txt-3)', fontSize: 10 }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto">
              {/* Column headers */}
              <div className="grid grid-cols-6 px-3 py-2 g-label"
                style={{ borderBottom: '1px solid var(--g-border)', background: 'var(--g-raised)' }}>
                <span>MEETING</span>
                <span>ACTION</span>
                <span className="text-right">RATE</span>
                <span className="text-right">INF BEFORE</span>
                <span className="text-right">INF AFTER</span>
                <span className="text-right">Δ INF</span>
              </div>

              {entries.map((e, i) => {
                const infDelta = e.infAfter != null && e.infBefore != null
                  ? e.infAfter - e.infBefore : null
                const deltaColor = infDelta == null ? 'var(--g-txt-3)'
                  : infDelta < -0.05 ? 'var(--g-up)'
                  : infDelta >  0.05 ? 'var(--g-down)'
                  : 'var(--g-txt-3)'

                return (
                  <motion.div
                    key={e.turn}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="grid grid-cols-6 px-3 py-2 text-xs hover:bg-[var(--g-raised)] transition-colors"
                    style={{ borderBottom: '1px solid var(--g-border)', fontFamily: 'var(--g-font-data)' }}
                  >
                    <span style={{ color: 'var(--g-txt-3)' }}>M{e.turn}</span>
                    <span className="font-black" style={{ color: e.meta.color }}>
                      {e.meta.label}
                    </span>
                    <span className="text-right tabular-nums" style={{ color: 'var(--g-txt-1)' }}>
                      {e.rate.toFixed(2)}%
                    </span>
                    <span className="text-right tabular-nums" style={{ color: 'var(--g-txt-2)' }}>
                      {e.infBefore != null ? `${e.infBefore.toFixed(1)}%` : '—'}
                    </span>
                    <span className="text-right tabular-nums" style={{ color: 'var(--g-txt-2)' }}>
                      {e.infAfter != null ? `${e.infAfter.toFixed(1)}%` : '—'}
                    </span>
                    <span className="text-right tabular-nums font-bold" style={{ color: deltaColor }}>
                      {infDelta != null
                        ? `${infDelta >= 0 ? '+' : ''}${infDelta.toFixed(2)}%`
                        : '—'}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

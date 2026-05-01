'use client'

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type CommandBarProps = {
  onRaise: () => void
  onCut: () => void
  onHold: () => void
  onQE: () => void
  onQT: () => void
  disabled?: boolean
  recommendation?: 'raise' | 'cut' | 'hold' | 'qe' | 'qt' | null
  fedEarned?: number
}

const commands = [
  { key: 'F1', label: 'RAISE', sub: '+25 bps',   action: 'raise', from: '#ef5350', to: '#c62828', glow: 'rgba(239,83,80,0.3)',   border: 'rgba(239,83,80,0.6)'   },
  { key: 'F2', label: 'CUT',   sub: '−25 bps',   action: 'cut',   from: '#26a69a', to: '#00796b', glow: 'rgba(38,166,154,0.3)',  border: 'rgba(38,166,154,0.6)'  },
  { key: 'F3', label: 'HOLD',  sub: 'No change',  action: 'hold', from: '#787b86', to: '#565a63', glow: 'rgba(120,123,134,0.2)', border: 'rgba(120,123,134,0.4)' },
  { key: 'F4', label: 'QE',    sub: 'Buy bonds',  action: 'qe',   from: '#2962ff', to: '#1565c0', glow: 'rgba(41,98,255,0.3)',   border: 'rgba(41,98,255,0.6)'   },
  { key: 'F5', label: 'QT',    sub: 'Sell bonds', action: 'qt',   from: '#ff9800', to: '#e65100', glow: 'rgba(255,152,0,0.3)',   border: 'rgba(255,152,0,0.6)'   },
] as const

const recColor: Record<string, string> = {
  raise: '#ef5350', cut: '#26a69a', hold: '#787b86', qe: '#2962ff', qt: '#ff9800',
}

export function CommandBar({
  onRaise, onCut, onHold, onQE, onQT,
  disabled = false, recommendation, fedEarned = 0,
}: CommandBarProps) {
  const execute = useCallback((action: string) => {
    if (disabled) return
    const map: Record<string, () => void> = { raise: onRaise, cut: onCut, hold: onHold, qe: onQE, qt: onQT }
    map[action]?.()
  }, [disabled, onRaise, onCut, onHold, onQE, onQT])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const map: Record<string, string> = { F1: 'raise', F2: 'cut', F3: 'hold', F4: 'qe', F5: 'qt' }
      if (map[e.key]) { e.preventDefault(); execute(map[e.key]) }
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [execute])

  return (
    <div
      className="g-panel overflow-hidden"
      style={{ borderLeft: '2px solid var(--g-brand)' }}
    >
      {/* Top glow line */}
      <div
        className="h-px w-full"
        style={{ background: 'linear-gradient(90deg, var(--g-brand) 0%, transparent 60%)' }}
      />

      <div className="flex items-center justify-between px-4 py-3 gap-4 flex-wrap">
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {commands.map((cmd) => {
            const isRec = recommendation === cmd.action
            return (
              <motion.button
                key={cmd.key}
                onClick={() => execute(cmd.action)}
                disabled={disabled}
                whileTap={{ scale: 0.91, y: 2 }}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="relative group flex flex-col items-center justify-center px-5 py-2.5 rounded-sm min-w-[80px] disabled:opacity-25 disabled:cursor-not-allowed select-none"
                style={{
                  background: `linear-gradient(160deg, ${cmd.from}, ${cmd.to})`,
                  boxShadow: isRec
                    ? `0 0 24px ${cmd.glow}, 0 2px 8px rgba(0,0,0,0.8)`
                    : '0 2px 8px rgba(0,0,0,0.6)',
                  border: `1px solid ${isRec ? cmd.border : cmd.border.replace('0.5)', '0.15)')}`,
                }}
              >
                {/* Top shimmer */}
                <span
                  className="absolute inset-x-0 top-0 h-px opacity-30"
                  style={{ background: 'linear-gradient(90deg, transparent, white, transparent)' }}
                />
                {/* Hover glow */}
                <span
                  className="absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ background: `radial-gradient(ellipse at 50% 0%, ${cmd.glow} 0%, transparent 70%)` }}
                />

                {/* REC badge */}
                <AnimatePresence>
                  {isRec && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-2 -right-2 text-[8px] font-black px-1.5 py-0.5 rounded-sm z-10"
                      style={{ background: cmd.glow, color: '#000', fontFamily: "'Orbitron', monospace" }}
                    >
                      REC
                    </motion.span>
                  )}
                </AnimatePresence>

                <span className="relative flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-mono text-white/30 leading-none">{cmd.key}</span>
                  <span
                    className="text-sm font-black text-white leading-none tracking-wide"
                    style={{ fontFamily: "'Orbitron', monospace" }}
                  >
                    {cmd.label}
                  </span>
                  <span className="text-[9px] font-mono text-white/40 leading-none">{cmd.sub}</span>
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* Right status */}
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-mono tracking-widest text-[#3f3f46] uppercase">FOMC REC</span>
            <span
              className="text-sm font-black font-mono"
              style={{
                fontFamily: "'Orbitron', monospace",
                color: recommendation ? recColor[recommendation] : '#71717a',
              }}
            >
              {(recommendation ?? 'HOLD').toUpperCase()}
            </span>
          </div>

          <div className="w-px h-8 bg-[#2a2a2e]" />

          <div className="flex flex-col items-end">
            <span className="text-[9px] font-mono tracking-widest text-[#3f3f46] uppercase">$FED Earned</span>
            <motion.span
              key={fedEarned}
              initial={{ scale: 1.4, color: '#ff6900' }}
              animate={{ scale: 1, color: '#ffffff' }}
              transition={{ duration: 0.35 }}
              className="text-sm font-black font-mono"
              style={{ fontFamily: "'Orbitron', monospace" }}
            >
              {fedEarned.toLocaleString()}
            </motion.span>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  label: string
  value: number
  children: React.ReactNode
}

// Content lookup — what each metric means in context
function getTooltipContent(label: string, value: number): { what: string; now: string; why: string } {
  switch (label) {
    case 'INFLATION':
      return {
        what: 'Core PCE inflation — the Fed\'s preferred measure, strips out food and energy volatility.',
        now: value < 1.5 ? 'Dangerously low. Deflation risk — prices falling hurts spending and growth.'
           : value < 2.5 ? 'Near the 2% target. This is where you want it.'
           : value < 4   ? 'Above target. Purchasing power is eroding. Action likely needed.'
           :               'Crisis level. Consumers are feeling it. Credibility is at stake.',
        why: 'The Fed targets 2%. Below 1.5% risks deflation. Above 4% demands aggressive action.',
      }
    case 'UNEMPLOYMENT':
      return {
        what: 'Share of the labor force actively seeking work. The Fed\'s "maximum employment" mandate.',
        now: value < 3.5 ? 'Overheating. Tight labor market drives wage inflation — watch PCE.'
           : value < 5   ? 'Near NAIRU (~4%). Full employment without wage pressure.'
           : value < 7   ? 'Softening. Workers struggling. Consider stimulus.'
           :               'Recession territory. Emergency action warranted.',
        why: 'NAIRU (non-accelerating inflation rate) is ~4%. Above it = slack. Below it = overheating.',
      }
    case 'GDP GROWTH':
      return {
        what: 'Real GDP growth annualized. Measures the economy\'s expansion or contraction.',
        now: value < -1  ? 'Contraction. Two consecutive quarters = technical recession.'
           : value < 0   ? 'Near-zero growth. Stagnation risk.'
           : value < 1   ? 'Below potential (~2%). Economy running below capacity.'
           : value < 3   ? 'Healthy growth range.'
           :               'Above potential. Risk of overheating.',
        why: 'US potential growth ~2%. Below = recession risk. Above = inflation pressure.',
      }
    case 'FED FUNDS':
      return {
        what: 'The overnight lending rate between banks — the Fed\'s primary policy lever.',
        now: value < 1   ? 'Near zero — emergency/stimulus mode. QE likely needed too.'
           : value < 3   ? 'Accommodative. Cheaper borrowing stimulates growth.'
           : value < 5   ? 'Neutral territory. Neither stimulating nor restricting.'
           :               'Restrictive. Actively cooling the economy.',
        why: 'Every rate change ripples through mortgages, business loans, and the dollar within weeks.',
      }
    case '10Y YIELD':
      return {
        what: '10-year Treasury yield — set by markets, not the Fed. Reflects growth and inflation expectations.',
        now: value < 2   ? 'Very low. Markets expect weak growth or Fed cuts.'
           : value < 4   ? 'Normal range. Markets are calm.'
           :               'Elevated. Markets pricing in persistent inflation or higher neutral rates.',
        why: 'When 10Y < 2Y (yield curve inverts), recession typically follows within 12-18 months.',
      }
    case 'VIX':
      return {
        what: 'CBOE Volatility Index — "fear gauge" measuring expected S&P 500 volatility over 30 days.',
        now: value < 15  ? 'Complacent. Markets are calm — can be a contrarian warning.'
           : value < 25  ? 'Normal volatility range.'
           : value < 35  ? 'Elevated stress. Markets are nervous.'
           :               'Crisis level. Comparable to 2008, 2020 COVID crash.',
        why: 'VIX above 30 often signals forced selling and liquidity stress. Fed typically responds.',
      }
    default:
      return { what: label, now: `Current value: ${value}`, why: '' }
  }
}

export function MetricTooltip({ label, value, children }: Props) {
  const [visible, setVisible] = useState(false)
  const content = getTooltipContent(label, value)

  return (
    <div className="relative" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full top-0 ml-2 z-50 w-64 rounded-sm shadow-xl"
            style={{
              background: 'var(--g-surface)',
              border: '1px solid var(--g-border-bright)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--g-border)' }}>
              <div className="g-label mb-0.5" style={{ color: 'var(--g-brand)' }}>{label}</div>
              <div className="text-xs" style={{ color: 'var(--g-txt-2)', fontFamily: 'var(--g-font-data)' }}>
                {content.what}
              </div>
            </div>

            {/* Current reading */}
            <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--g-border)', background: 'var(--g-raised)' }}>
              <div className="g-label mb-1">Right Now</div>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--g-txt-1)', fontFamily: 'var(--g-font-data)' }}>
                {content.now}
              </div>
            </div>

            {/* Why it matters */}
            {content.why && (
              <div className="px-3 py-2">
                <div className="g-label mb-1">Why It Matters</div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--g-txt-3)', fontFamily: 'var(--g-font-data)' }}>
                  {content.why}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

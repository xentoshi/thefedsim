'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import type { NewsItem } from '@/engine/types'

type Props = {
  headlines: NewsItem[]
  spxLevel: number
  btcPrice: number
  fedFundsRate: number
  yield10y: number
  showBreaking?: boolean
  breakingMessage?: string
  onHelp?: () => void
}

function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="tabular-nums" style={{ fontSize: 11, color: 'var(--g-txt-3)', fontFamily: 'var(--g-font-data)' }}>
      {time.toLocaleTimeString('en-US', { hour12: false })}
    </span>
  )
}

export function TopBar({ headlines, spxLevel, btcPrice, fedFundsRate, yield10y, showBreaking, breakingMessage, onHelp }: Props) {
  const [idx, setIdx] = useState(0)
  const { setTheme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'

  useEffect(() => {
    if (headlines.length <= 1) return
    const id = setInterval(() => setIdx(i => (i + 1) % headlines.length), 5000)
    return () => clearInterval(id)
  }, [headlines.length])

  return (
    <div className="flex-shrink-0 flex items-center"
      style={{ background: 'var(--g-surface)', borderBottom: '1px solid var(--g-border)', height: 44 }}>

      {/* Breaking news — absolute overlay */}
      {showBreaking && breakingMessage && (
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 text-xs text-white font-bold"
          style={{ background: 'var(--g-down)', height: 44 }}>
          <span className="animate-pulse flex-shrink-0">BREAKING</span>
          <span className="font-normal truncate">{breakingMessage}</span>
        </div>
      )}

      {/* Brand */}
      <div className="flex items-center px-4 h-full flex-shrink-0"
        style={{ borderRight: '1px solid var(--g-border)' }}>
        <span className="font-black tracking-wider text-xs"
          style={{ fontFamily: 'var(--g-font-display)', color: 'var(--g-brand)' }}>
          FED SIM
        </span>
      </div>

      {/* Market tickers */}
      <div className="flex items-center gap-5 px-4 h-full flex-shrink-0"
        style={{ borderRight: '1px solid var(--g-border)' }}>
        {[
          { label: 'SPX', value: spxLevel.toLocaleString(),              color: 'var(--g-up)' },
          { label: 'BTC', value: `$${btcPrice.toLocaleString()}`,        color: 'var(--g-txt-1)' },
          { label: 'FFR', value: `${fedFundsRate.toFixed(2)}%`,          color: 'var(--g-txt-1)' },
          { label: '10Y', value: `${yield10y.toFixed(2)}%`,              color: 'var(--g-txt-1)' },
        ].map(t => (
          <div key={t.label} className="flex items-center gap-1.5">
            <span style={{ fontSize: 10, color: 'var(--g-txt-3)', fontFamily: 'var(--g-font-data)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {t.label}
            </span>
            <span style={{ fontSize: 12, color: t.color, fontFamily: 'var(--g-font-data)', fontWeight: 700 }}>
              {t.value}
            </span>
          </div>
        ))}
      </div>

      {/* Scrolling headline — flex-1 with overflow hidden */}
      <div className="flex-1 min-w-0 overflow-hidden px-4 flex items-center gap-2">
        <span className="flex-shrink-0" style={{ fontSize: 10, color: 'var(--g-down)', fontWeight: 700, letterSpacing: '0.12em' }}>
          LIVE
        </span>
        <span className="truncate" style={{ fontSize: 12, color: 'var(--g-txt-2)', fontFamily: 'var(--g-font-data)' }}>
          {headlines.length > 0 ? headlines[idx]?.headline : 'Awaiting market developments...'}
        </span>
      </div>

      {/* Right: clock + devnet + theme toggle */}
      <div className="flex items-center gap-3 px-4 h-full flex-shrink-0"
        style={{ borderLeft: '1px solid var(--g-border)' }}>
        <Clock />
        {onHelp && (
          <button
            onClick={onHelp}
            title="How to play"
            className="flex items-center justify-center w-7 h-7 rounded-sm transition-colors"
            style={{ background: 'var(--g-raised)', border: '1px solid var(--g-border)', color: 'var(--g-brand)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--g-font-data)' }}
          >
            ?
          </button>
        )}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title="Toggle theme"
          className="flex items-center justify-center w-7 h-7 rounded-sm transition-colors"
          style={{ background: 'var(--g-raised)', border: '1px solid var(--g-border)', color: 'var(--g-txt-2)' }}
        >
          {isDark ? '☀' : '☾'}
        </button>
      </div>
    </div>
  )
}

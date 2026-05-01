'use client'

import { motion } from 'framer-motion'
import type { GameState, FomcMeeting, GameEvent, NewsItem } from '@/engine/types'
import { getEventIcon } from '@/engine'
import { YieldCurvePanel } from '../YieldCurvePanel'

type Props = {
  state: GameState
  lastMeeting: FomcMeeting | null
  activeEvents: GameEvent[]
  headlines: NewsItem[]
}

type WatchRow = { label: string; value: string; change: string; up: boolean | null; target?: string }

function WatchlistRow({ row }: { row: WatchRow }) {
  const changeColor = row.up === null ? 'var(--g-txt-3)' : row.up ? 'var(--g-up)' : 'var(--g-down)'
  return (
    <div className="flex items-center px-3 py-1.5 hover:bg-[var(--g-raised)] transition-colors cursor-default"
      style={{ borderBottom: '1px solid var(--g-border)' }}>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold truncate" style={{ color: 'var(--g-txt-1)', fontFamily: 'var(--g-font-data)' }}>
          {row.label}
        </div>
        {row.target && <div className="text-[10px]" style={{ color: 'var(--g-txt-3)' }}>Target {row.target}</div>}
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <div className="text-xs font-bold tabular-nums" style={{ color: 'var(--g-txt-1)', fontFamily: 'var(--g-font-data)' }}>
          {row.value}
        </div>
        <div className="text-[10px] tabular-nums font-bold" style={{ color: changeColor }}>
          {row.change}
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5"
      style={{ background: 'var(--g-surface)', borderBottom: '1px solid var(--g-border)' }}>
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--g-txt-3)' }}>
        {title}
      </span>
      {count !== undefined && (
        <span className="text-[10px] font-bold" style={{ color: 'var(--g-warn)' }}>{count}</span>
      )}
    </div>
  )
}

const SEV_COLOR: Record<GameEvent['severity'], string> = {
  minor: '#2962ff', moderate: '#f59e0b', major: '#ff9800', crisis: '#ef5350',
}

function fmt(v: number, decimals = 1) { return v.toFixed(decimals) }
function pct(v: number, decimals = 1) { return `${fmt(v, decimals)}%` }
function delta(now: number, prev: number, decimals = 2) {
  const d = now - prev
  return (d >= 0 ? '+' : '') + d.toFixed(decimals) + '%'
}
function isUp(now: number, prev: number, inverse = false) {
  const up = now > prev
  return inverse ? !up : up
}

export function RightSidebar({ state, lastMeeting, activeEvents, headlines }: Props) {
  const prev = state.history[state.history.length - 1]

  const macroRows: WatchRow[] = [
    {
      label: 'Core Inflation (PCE)',
      value: pct(state.macro.coreInflation),
      change: prev ? delta(state.macro.coreInflation, prev.macro.coreInflation) : '—',
      up: prev ? isUp(state.macro.coreInflation, prev.macro.coreInflation, true) : null,
      target: '2.0%',
    },
    {
      label: 'Unemployment Rate',
      value: pct(state.macro.unemploymentRate),
      change: prev ? delta(state.macro.unemploymentRate, prev.macro.unemploymentRate) : '—',
      up: prev ? isUp(state.macro.unemploymentRate, prev.macro.unemploymentRate, true) : null,
      target: '~4.0%',
    },
    {
      label: 'GDP Growth',
      value: pct(state.macro.gdpGrowth),
      change: prev ? delta(state.macro.gdpGrowth, prev.macro.gdpGrowth) : '—',
      up: prev ? isUp(state.macro.gdpGrowth, prev.macro.gdpGrowth) : null,
    },
    {
      label: 'Fed Funds Rate',
      value: pct(state.financial.fedFundsRate, 2),
      change: prev ? delta(state.financial.fedFundsRate, prev.financial.fedFundsRate, 2) : '—',
      up: null,
    },
    {
      label: '10Y Treasury Yield',
      value: pct(state.financial.yield10y, 2),
      change: prev ? delta(state.financial.yield10y, prev.financial.yield10y, 2) : '—',
      up: null,
    },
    {
      label: 'VIX',
      value: fmt(state.financial.spxVolatility),
      change: prev ? (state.financial.spxVolatility - prev.financial.spxVolatility >= 0 ? '+' : '') + (state.financial.spxVolatility - prev.financial.spxVolatility).toFixed(1) : '—',
      up: prev ? isUp(state.financial.spxVolatility, prev.financial.spxVolatility, true) : null,
    },
  ]

  const marketRows: WatchRow[] = [
    {
      label: 'SPX',
      value: state.financial.spxLevel.toLocaleString('en-US', { maximumFractionDigits: 0 }),
      change: prev ? ((state.financial.spxLevel - prev.financial.spxLevel) / prev.financial.spxLevel * 100 >= 0 ? '+' : '') + ((state.financial.spxLevel - prev.financial.spxLevel) / prev.financial.spxLevel * 100).toFixed(2) + '%' : '—',
      up: prev ? isUp(state.financial.spxLevel, prev.financial.spxLevel) : null,
    },
    {
      label: 'BTC/USD',
      value: `$${state.financial.btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      change: prev ? ((state.financial.btcPrice - prev.financial.btcPrice) / prev.financial.btcPrice * 100 >= 0 ? '+' : '') + ((state.financial.btcPrice - prev.financial.btcPrice) / prev.financial.btcPrice * 100).toFixed(2) + '%' : '—',
      up: prev ? isUp(state.financial.btcPrice, prev.financial.btcPrice) : null,
    },
    {
      label: 'DXY (Dollar Index)',
      value: state.financial.dollarIndex?.toFixed(2) ?? '—',
      change: '—',
      up: null,
    },
  ]

  return (
    <div className="w-64 flex-shrink-0 flex flex-col text-sm"
      style={{ background: 'var(--g-base)', borderLeft: '1px solid var(--g-border)' }}>

      {/* Yield curve — pinned, always visible */}
      <div className="flex-shrink-0">
        <YieldCurvePanel state={state} />
      </div>

      {/* Everything else scrolls */}
      <div className="flex-1 overflow-y-auto">

      {/* Macro section */}
      <SectionHeader title="Macro Indicators" />
      {macroRows.map(r => <WatchlistRow key={r.label} row={r} />)}

      {/* Markets section */}
      <SectionHeader title="Markets" />
      {marketRows.map(r => <WatchlistRow key={r.label} row={r} />)}

      {/* Active events */}
      {activeEvents.length > 0 && (
        <>
          <SectionHeader title="Active Events" count={activeEvents.length} />
          {activeEvents.map(ev => (
            <div key={ev.id} className="flex items-start gap-2 px-3 py-2"
              style={{ borderBottom: '1px solid var(--g-border)', borderLeft: `2px solid ${SEV_COLOR[ev.severity]}` }}>
              <span className="text-sm flex-shrink-0">{getEventIcon(ev.category)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-snug font-medium truncate" style={{ color: 'var(--g-txt-1)' }}>{ev.name}</p>
                <p className="text-[10px] uppercase font-bold" style={{ color: SEV_COLOR[ev.severity] }}>{ev.severity}</p>
              </div>
            </div>
          ))}
        </>
      )}

      {/* FOMC last decision */}
      {lastMeeting && (
        <>
          <SectionHeader title="Last FOMC Decision" />
          <div className="px-3 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold" style={{ color: 'var(--g-txt-2)' }}>Decision</span>
              <span className="text-xs font-black uppercase px-2 py-0.5 rounded-sm"
                style={{
                  color: lastMeeting.decision === 'raise' || lastMeeting.decision === 'qt' ? 'var(--g-down)' : lastMeeting.decision === 'hold' ? 'var(--g-txt-3)' : 'var(--g-up)',
                  background: lastMeeting.decision === 'raise' || lastMeeting.decision === 'qt' ? 'rgba(239,83,80,0.1)' : lastMeeting.decision === 'hold' ? 'rgba(120,123,134,0.1)' : 'rgba(38,166,154,0.1)',
                }}>
                {lastMeeting.decision?.toUpperCase()}
              </span>
            </div>
            {lastMeeting.dissenters.length > 0 && (
              <p className="text-[10px]" style={{ color: 'var(--g-warn)' }}>
                {lastMeeting.dissenters.length} dissenting vote{lastMeeting.dissenters.length > 1 ? 's' : ''}
              </p>
            )}
            {lastMeeting.statement && (
              <p className="text-[10px] leading-relaxed mt-2 italic" style={{ color: 'var(--g-txt-3)' }}>
                &ldquo;{lastMeeting.statement.slice(0, 120)}&hellip;&rdquo;
              </p>
            )}
          </div>
        </>
      )}

      {/* Headlines */}
      {headlines.length > 0 && (
        <>
          <SectionHeader title="Headlines" />
          {headlines.slice(0, 4).map((h, i) => (
            <motion.div key={h.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className="px-3 py-2" style={{ borderBottom: '1px solid var(--g-border)' }}>
              <p className="text-xs leading-snug" style={{ color: 'var(--g-txt-1)' }}>{h.headline}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--g-txt-3)' }}>Just now</p>
            </motion.div>
          ))}
        </>
      )}
      </div>{/* end scrollable */}
    </div>
  )
}

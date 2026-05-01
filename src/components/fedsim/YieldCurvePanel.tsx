'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import type { GameState } from '@/engine/types'

type Props = { state: GameState }

const TIP = {
  contentStyle: { background: 'var(--g-surface)', border: '1px solid var(--g-border)', borderRadius: 2, fontSize: 10, fontFamily: 'Space Mono, monospace' },
  labelStyle: { color: 'var(--g-txt-3)' },
  itemStyle: { color: 'var(--g-txt-1)' },
}

export function YieldCurvePanel({ state }: Props) {
  const f = state.financial
  const data = [
    { tenor: '2Y',  yield: +f.yield2y.toFixed(2) },
    { tenor: '5Y',  yield: +f.yield5y.toFixed(2) },
    { tenor: '10Y', yield: +f.yield10y.toFixed(2) },
    { tenor: '30Y', yield: +f.yield30y.toFixed(2) },
  ]

  const spread = f.yield10y - f.yield2y   // 2s10s spread
  const inverted = spread < 0
  const spreadColor = inverted ? 'var(--g-down)' : spread < 0.25 ? 'var(--g-warn)' : 'var(--g-up)'

  return (
    <div className="g-panel overflow-hidden">
      <div className="g-panel-header flex items-center justify-between">
        <span>Yield Curve</span>
        <span className="g-label" style={{ color: spreadColor }}>
          2s10s: {spread >= 0 ? '+' : ''}{spread.toFixed(2)}%
        </span>
      </div>

      {/* Inversion warning */}
      {inverted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-3 py-2 text-xs font-mono flex items-center gap-2"
          style={{ background: 'rgba(239,83,80,0.08)', borderBottom: '1px solid var(--g-border)', color: 'var(--g-down)' }}
        >
          <span className="animate-pulse">⚠</span>
          Yield curve inverted — preceded every US recession since 1955
        </motion.div>
      )}

      {/* Chart */}
      <div className="px-2 pt-3 pb-1">
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="yc-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={inverted ? '#ef5350' : '#26a69a'} stopOpacity={0.25} />
                <stop offset="95%" stopColor={inverted ? '#ef5350' : '#26a69a'} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="tenor" tick={{ fill: 'var(--g-txt-3)' as string, fontSize: 9, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--g-txt-3)' as string, fontSize: 9, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip {...TIP} formatter={(v: number) => [`${v.toFixed(2)}%`, 'Yield']} />
            <Area
              type="monotone"
              dataKey="yield"
              stroke={inverted ? '#ef5350' : '#26a69a'}
              strokeWidth={2}
              fill="url(#yc-grad)"
              dot={{ fill: inverted ? '#ef5350' : '#26a69a', r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tenor values */}
      <div className="grid grid-cols-4 px-3 pb-3 gap-1">
        {data.map(d => (
          <div key={d.tenor} className="text-center">
            <div className="g-label">{d.tenor}</div>
            <div className="text-xs font-bold tabular-nums" style={{ fontFamily: 'var(--g-font-data)', color: 'var(--g-txt-1)' }}>
              {d.yield.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

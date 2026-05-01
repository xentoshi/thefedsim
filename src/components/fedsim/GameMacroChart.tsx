'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { GameState } from '@/engine/types'

type Props = { state: GameState }

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bb-panel overflow-hidden">
      <div className="bb-panel-header">{title}</div>
      <div className="p-3">{children}</div>
    </div>
  )
}

const tip = {
  contentStyle: { background: '#0f0f12', border: '1px solid #2a2a2e', borderRadius: 2, fontSize: 11, fontFamily: 'Space Mono, monospace' },
  labelStyle: { color: '#71717a' },
  itemStyle: { color: '#fff' },
}

export function GameMacroChart({ state }: Props) {
  // Build chart data from history + current turn
  const points = [
    ...state.history.map((h) => ({
      turn: `T${h.turn}`,
      inflation: +h.macro.coreInflation.toFixed(2),
      unemployment: +h.macro.unemploymentRate.toFixed(2),
      gdp: +h.macro.gdpGrowth.toFixed(2),
      rate: +h.financial.fedFundsRate.toFixed(2),
      yield10y: +h.financial.yield10y.toFixed(2),
    })),
    {
      turn: `T${state.turn}`,
      inflation: +state.macro.coreInflation.toFixed(2),
      unemployment: +state.macro.unemploymentRate.toFixed(2),
      gdp: +state.macro.gdpGrowth.toFixed(2),
      rate: +state.financial.fedFundsRate.toFixed(2),
      yield10y: +state.financial.yield10y.toFixed(2),
    },
  ]

  if (points.length < 2) {
    return (
      <ChartPanel title="MACRO INDICATORS">
        <div className="h-40 flex items-center justify-center text-[#3f3f46] text-xs font-mono">
          Make your first decision to see data
        </div>
      </ChartPanel>
    )
  }

  return (
    <div className="space-y-3">
      {/* Inflation + Unemployment */}
      <ChartPanel title="INFLATION &amp; UNEMPLOYMENT">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="turn" tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
            <Tooltip {...tip} formatter={(v: number) => `${v.toFixed(2)}%`} />
            <ReferenceLine y={2} stroke="#ff690030" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="inflation"    stroke="#ef4444" strokeWidth={2} dot={false} name="Inflation" />
            <Line type="monotone" dataKey="unemployment" stroke="#fbbf24" strokeWidth={2} dot={false} name="Unemployment" />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      {/* Rates */}
      <ChartPanel title="RATES">
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="turn" tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
            <Tooltip {...tip} formatter={(v: number) => `${v.toFixed(2)}%`} />
            <Line type="monotone" dataKey="rate"    stroke="#3b82f6" strokeWidth={2} dot={false} name="Fed Funds" />
            <Line type="monotone" dataKey="yield10y" stroke="#06b6d4" strokeWidth={2} dot={false} name="10Y Yield" />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  )
}

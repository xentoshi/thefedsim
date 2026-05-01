'use client'

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import type { GameState } from '@/engine/types'

type Props = { state: GameState }

// ─── Shared chart config ─────────────────────────────────────────────────────

const AXIS = { fill: 'var(--g-txt-3)' as string, fontSize: 9, fontFamily: 'Space Mono, monospace' }
const TIP  = {
  contentStyle: { background: 'var(--g-surface)', border: '1px solid var(--g-border)', borderRadius: 2, fontSize: 10, fontFamily: 'Space Mono, monospace' },
  labelStyle:   { color: 'var(--g-txt-3)' },
  itemStyle:    { color: 'var(--g-txt-1)' },
  cursor:       { stroke: 'var(--g-border-bright)' },
}

// ─── Build chart data from game history + current ────────────────────────────

function useChartData(state: GameState) {
  const points = [
    ...state.history.map((h) => ({
      label: `M${h.turn}`,
      inflation:    +h.macro.coreInflation.toFixed(2),
      unemployment: +h.macro.unemploymentRate.toFixed(2),
      gdp:          +h.macro.gdpGrowth.toFixed(2),
    })),
    {
      label: `M${state.turn}`,
      inflation:    +state.macro.coreInflation.toFixed(2),
      unemployment: +state.macro.unemploymentRate.toFixed(2),
      gdp:          +state.macro.gdpGrowth.toFixed(2),
    },
  ]
  return points
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChartColumn({ title, current, sub, children }: {
  title: string; current: string; sub: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col" style={{ borderLeft: '1px solid var(--g-border)', paddingLeft: 16 }}>
      <div className="g-label mb-1">{title}</div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-xl font-black tabular-nums" style={{ fontFamily: 'var(--g-font-display)', color: 'var(--g-txt-1)' }}>
          {current}
        </span>
        <span className="g-caption text-xs">{sub}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function PolicyRatePanel({ state }: { state: GameState }) {
  const lo = (state.financial.fedFundsRate - 0.125).toFixed(2)
  const hi = (state.financial.fedFundsRate + 0.125).toFixed(2)
  const trend = state.history.length >= 2
    ? state.financial.fedFundsRate - state.history[state.history.length - 1].financial.fedFundsRate
    : 0
  const trendColor = trend > 0 ? 'var(--g-down)' : trend < 0 ? 'var(--g-up)' : 'var(--g-txt-3)'
  const trendLabel = trend > 0 ? '▲ Tightening' : trend < 0 ? '▼ Easing' : '— Holding'

  return (
    <div className="flex flex-col" style={{ minWidth: 140 }}>
      <div className="g-label mb-1">Policy Rate</div>
      <div className="g-caption mb-4">Fed Funds Target Range</div>
      <div className="text-2xl font-black tabular-nums mb-1"
        style={{ fontFamily: 'var(--g-font-display)', color: 'var(--g-brand)' }}>
        {lo}% – {hi}%
      </div>
      <div className="text-xs font-mono mt-1" style={{ color: trendColor }}>{trendLabel}</div>

      <div className="mt-auto pt-4">
        <div className="g-label mb-2">Score Components</div>
        {[
          { label: 'Price Stability', v: state.score.priceStability },
          { label: 'Employment',      v: state.score.employment },
          { label: 'Credibility',     v: state.score.credibility },
        ].map(({ label, v }) => (
          <div key={label} className="mb-2">
            <div className="flex justify-between mb-0.5">
              <span className="g-caption text-xs">{label}</span>
              <span className="g-caption text-xs tabular-nums">{v.toFixed(0)}</span>
            </div>
            <div className="h-1 rounded-full" style={{ background: 'var(--g-raised)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(0, Math.min(100, v))}%`, background: v > 60 ? 'var(--g-up)' : v > 35 ? 'var(--g-warn)' : 'var(--g-down)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyChart() {
  return (
    <div className="h-32 flex items-center justify-center">
      <span className="g-caption text-xs">Make your first decision to see data</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EconomyAtAGlance({ state }: Props) {
  const data = useChartData(state)
  const hasData = data.length >= 2
  const latest = data[data.length - 1]

  return (
    <div className="g-panel overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--g-border)' }}>
        <span className="text-sm font-black" style={{ fontFamily: 'var(--g-font-display)', color: 'var(--g-txt-1)' }}>
          Economy at a Glance
        </span>
        <span className="g-label">Meeting {state.turn} of {state.maxTurns}</span>
      </div>

      {/* 4-column grid */}
      <div className="grid grid-cols-4 gap-0 p-4" style={{ columnGap: 0 }}>

        {/* Col 1 — Policy Rate */}
        <div className="pr-4">
          <PolicyRatePanel state={state} />
        </div>

        {/* Col 2 — Inflation */}
        <ChartColumn
          title="Inflation (Core PCE)"
          current={`${latest.inflation.toFixed(1)}%`}
          sub={`Meeting ${state.turn}`}
        >
          {hasData ? (
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip {...TIP} formatter={(v: number) => [`${v.toFixed(2)}%`, 'Core PCE']} />
                <ReferenceLine y={2} stroke="var(--g-up)" strokeDasharray="3 3" strokeOpacity={0.5} />
                <Line type="monotone" dataKey="inflation" stroke="var(--g-brand)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
          <div className="g-label mt-2" style={{ color: 'var(--g-txt-3)' }}>
            Target: <span style={{ color: 'var(--g-up)' }}>2.0%</span>
          </div>
        </ChartColumn>

        {/* Col 3 — Unemployment */}
        <ChartColumn
          title="Unemployment Rate"
          current={`${latest.unemployment.toFixed(1)}%`}
          sub={`Meeting ${state.turn}`}
        >
          {hasData ? (
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip {...TIP} formatter={(v: number) => [`${v.toFixed(2)}%`, 'Unemployment']} />
                <ReferenceLine y={4} stroke="var(--g-up)" strokeDasharray="3 3" strokeOpacity={0.5} />
                <Line type="monotone" dataKey="unemployment" stroke="#60a5fa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
          <div className="g-label mt-2" style={{ color: 'var(--g-txt-3)' }}>
            NAIRU: <span style={{ color: 'var(--g-up)' }}>~4.0%</span>
          </div>
        </ChartColumn>

        {/* Col 4 — GDP */}
        <ChartColumn
          title="GDP Growth"
          current={`${latest.gdp >= 0 ? '+' : ''}${latest.gdp.toFixed(1)}%`}
          sub={`Meeting ${state.turn}`}
        >
          {hasData ? (
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip {...TIP} formatter={(v: number) => [`${v.toFixed(2)}%`, 'GDP Growth']} />
                <ReferenceLine y={0} stroke="var(--g-border)" />
                <Bar dataKey="gdp" radius={[1, 1, 0, 0]}>
                  {data.map((d, idx) => (
                    <Cell key={idx} fill={d.gdp >= 0 ? 'var(--g-up)' : 'var(--g-down)'} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
          <div className="g-label mt-2" style={{ color: 'var(--g-txt-3)' }}>
            Annualized real GDP
          </div>
        </ChartColumn>

      </div>
    </div>
  )
}

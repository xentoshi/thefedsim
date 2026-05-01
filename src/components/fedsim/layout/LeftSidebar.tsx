'use client'

import { useMemo } from 'react'
import { MetricCard, TurnProgress, TrustMeter } from '../bloomberg'
import { scoreToGrade, gradeToColor } from '@/engine'
import { TaylorRule } from '../TaylorRule'
import { MetricTooltip } from '../MetricTooltip'
import type { GameState, PolicyScore } from '@/engine/types'

type Props = { state: GameState; score: PolicyScore }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="g-panel-header">{title}</div>
      <div className="space-y-px">{children}</div>
    </div>
  )
}

function BalanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="g-caption">{label}</span>
      <span className="g-data text-xs">{value}</span>
    </div>
  )
}

function fmtB(v: number) {
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}T` : `$${v.toFixed(0)}B`
}

export function LeftSidebar({ state, score }: Props) {
  const hasPlayed = state.turn > 0
  const grade = useMemo(() => scoreToGrade(score.overall), [score.overall])
  const gradeColor = useMemo(() => gradeToColor(grade), [grade])

  return (
    <div
      className="w-56 flex-shrink-0 flex flex-col overflow-y-auto"
      style={{ background: 'var(--g-base)', borderRight: '1px solid var(--g-border)' }}
    >
      {/* Turn progress */}
      <div className="p-3">
        <TurnProgress
          currentTurn={state.turn}
          maxTurns={state.maxTurns}
          status={state.status}
          scenarioName={state.scenario?.name}
        />
      </div>

      {/* Grade + Score — hero block */}
      <div className="mx-3 mb-3 g-panel p-3">
        <div className="g-label mb-2">Policy Grade</div>
        <div className="flex items-end justify-between">
          <span
            className="text-5xl font-black leading-none"
            style={{
              fontFamily: 'var(--g-font-display)',
              color: hasPlayed ? gradeColor : 'var(--g-txt-3)',
              textShadow: hasPlayed ? `0 0 20px ${gradeColor}80` : 'none',
            }}
          >
            {hasPlayed ? grade : '—'}
          </span>
          <div className="text-right">
            <div className="g-label mb-1">Score</div>
            <span
              className="text-2xl font-black"
              style={{ fontFamily: 'var(--g-font-display)', color: hasPlayed ? 'var(--g-txt-1)' : 'var(--g-txt-3)' }}
            >
              {hasPlayed ? score.overall.toFixed(0) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Trust meter — always below grade */}
      <div className="mx-3 mb-3">
        <TrustMeter value={state.credibility.overallScore} />
      </div>

      {/* Economy metrics */}
      <div className="mx-3 mb-3 g-panel overflow-hidden">
        <Section title="Economy">
          <MetricTooltip label="INFLATION" value={state.macro.coreInflation}>
            <MetricCard label="Inflation" value={state.macro.coreInflation} format="percent" target={2} warningThreshold={3} dangerThreshold={5} compact />
          </MetricTooltip>
          <MetricTooltip label="UNEMPLOYMENT" value={state.macro.unemploymentRate}>
            <MetricCard label="Unemployment" value={state.macro.unemploymentRate} format="percent" warningThreshold={5} dangerThreshold={7} compact />
          </MetricTooltip>
          <MetricTooltip label="GDP GROWTH" value={state.macro.gdpGrowth}>
            <MetricCard label="GDP Growth" value={state.macro.gdpGrowth} format="percent" warningThreshold={0.5} dangerThreshold={0} inverse compact />
          </MetricTooltip>
        </Section>
      </div>

      {/* Rates */}
      <div className="mx-3 mb-3 g-panel overflow-hidden">
        <Section title="Rates">
          <MetricTooltip label="FED FUNDS" value={state.financial.fedFundsRate}>
            <MetricCard label="Fed Funds" value={state.financial.fedFundsRate} format="percent" compact />
          </MetricTooltip>
          <MetricTooltip label="10Y YIELD" value={state.financial.yield10y}>
            <MetricCard label="10Y Yield" value={state.financial.yield10y} format="percent" compact />
          </MetricTooltip>
          <MetricTooltip label="VIX" value={state.financial.spxVolatility}>
            <MetricCard label="VIX" value={state.financial.spxVolatility} format="number" decimals={1} warningThreshold={25} dangerThreshold={35} compact />
          </MetricTooltip>
        </Section>
      </div>

      {/* Taylor Rule */}
      <div className="mx-3 mb-3">
        <TaylorRule state={state} />
      </div>

      {/* Balance sheet */}
      <div className="mx-3 mb-3 g-panel overflow-hidden">
        <div className="g-panel-header">Balance Sheet</div>
        <BalanceRow label="Total Assets" value={fmtB(state.balanceSheet.totalAssets)} />
        <BalanceRow label="Treasuries"   value={fmtB(state.balanceSheet.treasuries)} />
        <BalanceRow label="MBS"          value={fmtB(state.balanceSheet.mbs)} />
        <BalanceRow label="Reserves"     value={fmtB(state.balanceSheet.reserves)} />
      </div>
    </div>
  )
}

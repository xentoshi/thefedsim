// src/components/fedsim/FedSimGame.tsx
// Main game UI component using the new engine

'use client'

import { useState, useEffect } from 'react'
import { useGameEngine } from '@/hooks/useGameEngine'
import {
  formatBillions,
  scoreToGrade,
  gradeToColor,
  getEventIcon,
  getEventColor,
  SCENARIOS,
} from '@/engine'
import { Toaster, toast } from 'react-hot-toast'

// ============================================================================
// METRIC GAUGE COMPONENT
// ============================================================================

function MetricGauge({
  label,
  value,
  format = 'percent',
  target,
  warningThreshold,
  dangerThreshold,
  inverse = false,
}: {
  label: string
  value: number
  format?: 'percent' | 'number' | 'billions'
  target?: number
  warningThreshold?: number
  dangerThreshold?: number
  inverse?: boolean
}) {
  let displayValue: string
  switch (format) {
    case 'percent':
      displayValue = `${value.toFixed(1)}%`
      break
    case 'billions':
      displayValue = formatBillions(value)
      break
    default:
      displayValue = value.toFixed(1)
  }

  let color = 'text-green-400'
  if (dangerThreshold !== undefined) {
    const inDanger = inverse ? value < dangerThreshold : value > dangerThreshold
    if (inDanger) color = 'text-red-400'
    else if (warningThreshold !== undefined) {
      const inWarning = inverse ? value < warningThreshold : value > warningThreshold
      if (inWarning) color = 'text-yellow-400'
    }
  }

  return (
    <div className="flex flex-col">
      <span className="text-xs text-zinc-500 uppercase tracking-wide">{label}</span>
      <span className={`text-lg font-mono font-bold ${color}`}>{displayValue}</span>
      {target !== undefined && (
        <span className="text-xs text-zinc-600">Target: {target}%</span>
      )}
    </div>
  )
}

// ============================================================================
// NEWS TICKER COMPONENT
// ============================================================================

function NewsTicker({ headlines }: { headlines: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (headlines.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % headlines.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [headlines.length])

  if (headlines.length === 0) {
    return (
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 text-sm text-zinc-500">
        Awaiting market data...
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 overflow-hidden">
      <div className="flex items-center gap-4">
        <span className="text-red-500 font-bold text-xs animate-pulse">LIVE</span>
        <span className="text-sm text-zinc-300 truncate">{headlines[currentIndex]}</span>
      </div>
    </div>
  )
}

// ============================================================================
// POLICY TOOL BUTTON
// ============================================================================

function PolicyButton({
  label,
  description,
  onClick,
  color,
  disabled = false,
}: {
  label: string
  description: string
  onClick: () => void
  color: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${color}
        w-full px-4 py-3 rounded-lg
        text-left transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:brightness-110 active:brightness-90
      `}
    >
      <div className="font-bold text-white">{label}</div>
      <div className="text-xs text-white/70">{description}</div>
    </button>
  )
}

// ============================================================================
// FOMC PANEL
// ============================================================================

function FomcPanel({
  meeting,
  committee,
}: {
  meeting: ReturnType<typeof useGameEngine>['lastMeeting']
  committee: ReturnType<typeof useGameEngine>['state']['committee']
}) {
  if (!meeting) return null

  const getVoteColor = (vote: string) => {
    switch (vote) {
      case 'raise':
      case 'qt':
        return 'text-red-400'
      case 'cut':
      case 'qe':
        return 'text-green-400'
      default:
        return 'text-zinc-400'
    }
  }

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
      <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-3">FOMC Meeting</h3>

      <div className="space-y-2 mb-4">
        {committee.slice(0, 5).map((member) => {
          const vote = meeting.votes.get(member.id) || 'hold'
          const isDissenter = meeting.dissenters.includes(member.id)
          return (
            <div key={member.id} className="flex items-center justify-between text-sm">
              <span className={`${isDissenter ? 'text-orange-400' : 'text-zinc-300'}`}>
                {member.name}
                {isDissenter && ' *'}
              </span>
              <span className={`font-mono font-bold ${getVoteColor(vote)}`}>
                {vote.toUpperCase()}
              </span>
            </div>
          )
        })}
      </div>

      <div className="border-t border-zinc-800 pt-3">
        <div className="text-xs text-zinc-500">Decision</div>
        <div className={`text-lg font-bold ${getVoteColor(meeting.decision)}`}>
          {meeting.decision.toUpperCase()}
        </div>
        {meeting.dissenters.length > 0 && (
          <div className="text-xs text-orange-400 mt-1">
            {meeting.dissenters.length} dissent{meeting.dissenters.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// EVENTS PANEL
// ============================================================================

function EventsPanel({
  events,
}: {
  events: ReturnType<typeof useGameEngine>['activeEvents']
}) {
  if (events.length === 0) return null

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
      <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Active Events</h3>
      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-2 text-sm p-2 rounded"
            style={{ backgroundColor: getEventColor(event.severity) + '20' }}
          >
            <span>{getEventIcon(event.category)}</span>
            <span className="text-zinc-300">{event.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// SCORE PANEL
// ============================================================================

function ScorePanel({ score }: { score: ReturnType<typeof useGameEngine>['score'] }) {
  const grade = scoreToGrade(score.overall)
  const gradeColor = gradeToColor(grade)

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
      <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Policy Score</h3>

      <div className="flex items-center justify-between mb-4">
        <span
          className="text-4xl font-bold"
          style={{ color: gradeColor }}
        >
          {grade}
        </span>
        <span className="text-2xl font-mono text-zinc-300">{score.overall.toFixed(0)}</span>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-zinc-500">Price Stability</span>
          <span className="text-zinc-300">{score.priceStability.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Employment</span>
          <span className="text-zinc-300">{score.employment.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Financial Stability</span>
          <span className="text-zinc-300">{score.financialStability.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Credibility</span>
          <span className="text-zinc-300">{score.credibility.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Growth</span>
          <span className="text-zinc-300">{score.growth.toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SCENARIO SELECTOR
// ============================================================================

function ScenarioSelector({
  onSelect,
  currentScenario,
}: {
  onSelect: (scenarioId: string) => void
  currentScenario: string | null
}) {
  const scenarios = Object.values(SCENARIOS)

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
      <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Scenarios</h3>
      <div className="space-y-2">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario.id)}
            className={`
              w-full text-left p-3 rounded-lg transition-all
              ${currentScenario === scenario.id
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }
            `}
          >
            <div className="font-bold text-sm">{scenario.name}</div>
            <div className="text-xs opacity-70">{scenario.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// GAME OVER MODAL
// ============================================================================

function GameOverModal({
  isWon,
  score,
  onRestart,
  onNewScenario,
}: {
  isWon: boolean
  score: ReturnType<typeof useGameEngine>['score']
  onRestart: () => void
  onNewScenario: () => void
}) {
  const grade = scoreToGrade(score.overall)
  const gradeColor = gradeToColor(grade)

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-8 max-w-md w-full mx-4">
        <h2 className={`text-3xl font-bold mb-2 ${isWon ? 'text-green-400' : 'text-red-400'}`}>
          {isWon ? 'Mission Complete' : 'Game Over'}
        </h2>
        <p className="text-zinc-400 mb-6">
          {isWon
            ? 'You successfully navigated the economic challenges.'
            : 'The economy spiraled out of control.'}
        </p>

        <div className="bg-zinc-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Final Grade</span>
            <span className="text-4xl font-bold" style={{ color: gradeColor }}>
              {grade}
            </span>
          </div>
          <div className="text-2xl font-mono text-zinc-300 text-right">
            {score.overall.toFixed(0)} / 100
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRestart}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={onNewScenario}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            New Scenario
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN GAME COMPONENT
// ============================================================================

export function FedSimGame() {
  const {
    state,
    isPlaying,
    isWon,
    isLost,
    currentNews,
    activeEvents,
    lastMeeting,
    score,
    raiseRates,
    cutRates,
    holdRates,
    startQE,
    startQT,
    startGame,
    resetGame,
    lastResult,
  } = useGameEngine('sandbox')

  const [showScenarioSelector, setShowScenarioSelector] = useState(false)

  // Show toast on action
  useEffect(() => {
    if (lastResult?.success && lastResult.events.length > 0) {
      for (const event of lastResult.events) {
        toast(event.headline, {
          icon: getEventIcon(event.category),
          duration: 5000,
        })
      }
    }
  }, [lastResult])

  const handleSelectScenario = (scenarioId: string) => {
    startGame(scenarioId)
    setShowScenarioSelector(false)
  }

  const headlines = currentNews.map((n) => n.headline)

  return (
    <>
      <Toaster position="top-right" />

      {/* Game Over Modal */}
      {(isWon || isLost) && (
        <GameOverModal
          isWon={isWon}
          score={score}
          onRestart={resetGame}
          onNewScenario={() => setShowScenarioSelector(true)}
        />
      )}

      {/* Scenario Selector Modal */}
      {showScenarioSelector && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Select Scenario</h2>
              <button
                onClick={() => setShowScenarioSelector(false)}
                className="text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <ScenarioSelector
              onSelect={handleSelectScenario}
              currentScenario={state.scenario?.id ?? null}
            />
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#0a0a0c] text-white font-sans">
        {/* News Ticker */}
        <NewsTicker headlines={headlines} />

        {/* Header */}
        <header className="border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Fed Simulator</h1>
              <p className="text-sm text-zinc-500">
                {state.scenario?.name ?? 'Sandbox Mode'} | Turn {state.turn} / {state.maxTurns}
              </p>
            </div>
            <button
              onClick={() => setShowScenarioSelector(true)}
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Change Scenario
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Left Column - Metrics Dashboard */}
          <div className="lg:col-span-3 space-y-6">
            {/* Core Metrics */}
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
              <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-4">Economy</h3>
              <div className="grid grid-cols-2 gap-4">
                <MetricGauge
                  label="Inflation"
                  value={state.macro.coreInflation}
                  target={2}
                  warningThreshold={3}
                  dangerThreshold={5}
                />
                <MetricGauge
                  label="Unemployment"
                  value={state.macro.unemploymentRate}
                  warningThreshold={5}
                  dangerThreshold={7}
                />
                <MetricGauge
                  label="GDP Growth"
                  value={state.macro.gdpGrowth}
                  warningThreshold={0.5}
                  dangerThreshold={0}
                  inverse
                />
                <MetricGauge
                  label="Credibility"
                  value={state.credibility.overallScore}
                  format="number"
                  warningThreshold={60}
                  dangerThreshold={40}
                  inverse
                />
              </div>
            </div>

            {/* Financial Conditions */}
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
              <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-4">Markets</h3>
              <div className="grid grid-cols-2 gap-4">
                <MetricGauge
                  label="Fed Funds"
                  value={state.financial.fedFundsRate}
                />
                <MetricGauge
                  label="10Y Yield"
                  value={state.financial.yield10y}
                />
                <MetricGauge
                  label="S&P 500"
                  value={state.financial.spxLevel}
                  format="number"
                />
                <MetricGauge
                  label="VIX"
                  value={state.financial.spxVolatility}
                  format="number"
                  warningThreshold={25}
                  dangerThreshold={35}
                />
              </div>
            </div>

            {/* Balance Sheet */}
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
              <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-4">Balance Sheet</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total Assets</span>
                  <span className="text-zinc-300 font-mono">
                    {formatBillions(state.balanceSheet.totalAssets)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Treasuries</span>
                  <span className="text-zinc-300 font-mono">
                    {formatBillions(state.balanceSheet.treasuries)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">MBS</span>
                  <span className="text-zinc-300 font-mono">
                    {formatBillions(state.balanceSheet.mbs)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Reserves</span>
                  <span className="text-zinc-300 font-mono">
                    {formatBillions(state.balanceSheet.reserves)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column - Main Action Area */}
          <div className="lg:col-span-6 space-y-6">
            {/* Scenario Briefing */}
            {state.scenario && state.turn === 0 && (
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <h3 className="font-bold text-blue-400 mb-2">Briefing</h3>
                <p className="text-sm text-zinc-300 whitespace-pre-line">
                  {state.scenario.briefing}
                </p>
              </div>
            )}

            {/* Active Events */}
            <EventsPanel events={activeEvents} />

            {/* Policy Tools */}
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
              <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-4">
                Policy Tools
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <PolicyButton
                  label="Raise Rates"
                  description="+25 bps to fight inflation"
                  color="bg-red-700"
                  onClick={() => raiseRates()}
                  disabled={!isPlaying}
                />
                <PolicyButton
                  label="Cut Rates"
                  description="-25 bps to stimulate growth"
                  color="bg-green-700"
                  onClick={() => cutRates()}
                  disabled={!isPlaying}
                />
                <PolicyButton
                  label="Hold Rates"
                  description="Maintain current stance"
                  color="bg-zinc-700"
                  onClick={() => holdRates()}
                  disabled={!isPlaying}
                />
                <PolicyButton
                  label="QE"
                  description="Expand balance sheet"
                  color="bg-blue-700"
                  onClick={() => startQE()}
                  disabled={!isPlaying}
                />
                <PolicyButton
                  label="QT"
                  description="Shrink balance sheet"
                  color="bg-orange-700"
                  onClick={() => startQT()}
                  disabled={!isPlaying}
                />
              </div>
            </div>

            {/* History Chart Placeholder */}
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 h-64 flex items-center justify-center">
              <p className="text-zinc-500">
                Charts coming soon - inflation, GDP, unemployment over time
              </p>
            </div>
          </div>

          {/* Right Column - FOMC & Score */}
          <div className="lg:col-span-3 space-y-6">
            <ScorePanel score={score} />
            <FomcPanel meeting={lastMeeting} committee={state.committee} />

            {/* Objectives */}
            {state.scenario && state.scenario.objectives.length > 0 && (
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
                <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Objectives</h3>
                <div className="space-y-2">
                  {state.scenario.objectives.map((obj, i) => {
                    const achieved = obj.condition(state)
                    return (
                      <div
                        key={i}
                        className={`text-sm p-2 rounded ${
                          achieved ? 'bg-green-900/30 text-green-400' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {achieved ? '✓' : '○'} {obj.description}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

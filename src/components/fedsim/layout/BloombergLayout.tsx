// src/components/fedsim/layout/BloombergLayout.tsx
// Main orchestrator replacing FedSimGame.tsx

'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useTheme } from 'next-themes'
import { useGameEngine } from '@/hooks/useGameEngine'
import { SCENARIOS, scoreToGrade, gradeToColor, compareToChairs } from '@/engine'
import { TurnResolutionCard } from '../TurnResolutionCard'
import { PressConferenceModal } from '../PressConferenceModal'
import { OnboardingModal } from '../OnboardingModal'
import { XpPopup } from '../XpPopup'
import { EconomyAtAGlance } from '../EconomyAtAGlance'
import { DecisionJournal } from '../DecisionJournal'
import { FedSimChart } from '../fedsim-chart'
import { getEconomicRegime } from '@/engine/regimes'
import type { GameState } from '@/engine/types'
import type { CandlestickData, Time } from 'lightweight-charts'

// Build OHLC candles from SPX history — one candle per FOMC meeting
function buildCandles(state: GameState): CandlestickData[] {
  const BASE_TIME = 1609459200 // 2021-01-01
  const INTERVAL  = 60 * 60 * 24 * 45 // ~45 days per meeting

  const all = [
    ...state.history.map(h => h.financial.spxLevel),
    state.financial.spxLevel,
  ]

  // Show a single opening candle before any moves are made
  if (all.length === 1) {
    const price = all[0]
    const wick = price * 0.004
    return [{ time: BASE_TIME as Time, open: price * 0.998, close: price, high: price + wick, low: price * 0.998 - wick }]
  }

  return all.map((close, i) => {
    const open = i === 0 ? close * 0.998 : all[i - 1]
    const body = Math.abs(close - open)
    const wick = body * 0.25 + close * 0.0008  // small wicks, ~25% of body
    return {
      time:  (BASE_TIME + i * INTERVAL) as Time,
      open,
      close,
      high:  Math.max(open, close) + wick,
      low:   Math.min(open, close) - wick,
    }
  })
}

// Bloomberg components
import {
  AlertBanner,
  useAlerts,
  CrisisOverlay,
  calculateCrisisLevel,
  MarketReaction,
  BackgroundPulse,
} from '../bloomberg'

// Layout components
import { TopBar } from './TopBar'
import { LeftSidebar } from './LeftSidebar'
import { RightSidebar } from './RightSidebar'
import { BottomBar } from './BottomBar'

import type { SimplePolicyAction, NewsItem } from '@/engine/types'

export function BloombergLayout() {
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
  } = useGameEngine('tutorial')

  const [showScenarioSelector, setShowScenarioSelector] = useState(false)
  const { alerts, addAlert, dismissAlert } = useAlerts()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'
  const [actionTimestamp, setActionTimestamp] = useState(0)
  const [lastAction, setLastAction] = useState<SimplePolicyAction | null>(null)
  const [pulseColor, setPulseColor] = useState<'red' | 'green' | 'blue' | 'orange' | 'zinc'>('blue')


  // A: Turn resolution card
  const [showResolution, setShowResolution] = useState(false)
  const [resolutionAction, setResolutionAction] = useState<SimplePolicyAction | null>(null)
  const prevStateRef = useRef<GameState>(state)

  // Press conference
  const [showPressConference, setShowPressConference] = useState(false)
  const [pressConferenceAction, setPressConferenceAction] = useState<SimplePolicyAction | null>(null)

  // Onboarding — show on first visit, persisted in localStorage
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem('fedsim_onboarded')
  })
  const dismissOnboarding = () => {
    localStorage.setItem('fedsim_onboarded', '1')
    setShowOnboarding(false)
  }

  // C: XP popup
  const [xpTrigger, setXpTrigger] = useState(0)
  const [streak, setStreak] = useState(0)

  // Calculate crisis level
  const crisisLevel = useMemo(
    () => calculateCrisisLevel(state),
    [state]
  )

  // Handle events — add to alert banner only (TurnResolutionCard shows the detail)
  useEffect(() => {
    if (lastResult?.success && lastResult.events.length > 0) {
      for (const event of lastResult.events) {
        addAlert({
          message: event.headline,
          severity: event.severity === 'crisis' ? 'critical' : event.severity === 'major' ? 'warning' : 'info',
          category: event.category,
          autoDismiss: true,
          duration: 6000,
        })
      }
    }
  }, [lastResult]) // eslint-disable-line react-hooks/exhaustive-deps

  // Show turn resolution card whenever lastResult updates
  useEffect(() => {
    if (!lastResult || !resolutionAction) return
    setShowResolution(true)

    // C: XP popup + streak
    const delta = lastResult.newState.score.overall - prevStateRef.current.score.overall
    const newStreak = delta > 0 ? streak + 1 : 0
    setStreak(newStreak)
    setXpTrigger((t) => t + 1)
  }, [lastResult])  // eslint-disable-line react-hooks/exhaustive-deps

  // Track last action for market reaction + turn card
  const handleAction = (action: SimplePolicyAction) => {
    prevStateRef.current = state   // snapshot before action
    setResolutionAction(action)
    setLastAction(action)
    setActionTimestamp(Date.now())

    const colorMap: Record<SimplePolicyAction, typeof pulseColor> = {
      raise: 'red', cut: 'green', hold: 'zinc', qe: 'blue', qt: 'orange',
    }
    setPulseColor(colorMap[action])
  }

  const handleRaise = () => { handleAction('raise'); raiseRates() }
  const handleCut   = () => { handleAction('cut');   cutRates()   }
  const handleHold  = () => { handleAction('hold');  holdRates()  }
  const handleQE    = () => { handleAction('qe');    startQE()    }
  const handleQT    = () => { handleAction('qt');    startQT()    }

  const handleSelectScenario = (scenarioId: string) => {
    startGame(scenarioId)
    setShowScenarioSelector(false)
  }

  // Convert news to NewsItem format
  const newsItems: NewsItem[] = currentNews

  // Get FOMC recommendation — fall back to deriving from state when no meeting yet
  const fomcRecommendation = useMemo(() => {
    if (lastMeeting?.decision) return lastMeeting.decision
    const inf = state.macro.coreInflation
    const unemp = state.macro.unemploymentRate
    if (inf > 3.5) return 'raise'
    if (inf < 1.5 || unemp > 6) return 'cut'
    if (inf > 2.8) return 'raise'
    return 'hold'
  }, [lastMeeting, state.macro.coreInflation, state.macro.unemploymentRate])

  const isFirstTurn = state.turn === 0
  const regime = getEconomicRegime(state)

  // Calculate $FED earned from objectives
  const fedEarned = useMemo(() => {
    if (!state.scenario) return 0
    return state.scenario.objectives.filter((obj) => obj.condition(state)).length * 100
  }, [state])

  return (
    <>
      {/* Alerts */}
      <AlertBanner alerts={alerts} onDismiss={dismissAlert} />

      {/* Crisis Overlay */}
      <CrisisOverlay level={crisisLevel} />

      {/* Market Reaction */}
      <MarketReaction lastAction={lastAction} timestamp={actionTimestamp} />

      {/* Background Pulse */}
      <BackgroundPulse trigger={actionTimestamp} color={pulseColor} />

      {/* A: Turn resolution card */}
      {showResolution && lastResult && resolutionAction && (
        <TurnResolutionCard
          result={lastResult}
          action={resolutionAction}
          prevState={prevStateRef.current}
          onDismiss={() => setShowResolution(false)}
          onPressConference={() => {
            setPressConferenceAction(resolutionAction)
            setShowResolution(false)
            setShowPressConference(true)
          }}
        />
      )}

      {/* Onboarding tour */}
      {showOnboarding && <OnboardingModal onDismiss={dismissOnboarding} />}

      {/* Press conference */}
      {showPressConference && pressConferenceAction && (
        <PressConferenceModal
          action={pressConferenceAction}
          state={state}
          onDismiss={() => setShowPressConference(false)}
        />
      )}

      {/* C: XP / streak popup */}
      <XpPopup
        scoreDelta={lastResult ? lastResult.newState.score.overall - prevStateRef.current.score.overall : 0}
        streak={streak}
        trigger={xpTrigger}
      />

      {/* Game Over / Debrief */}
      {(isWon || isLost) && (
        <GameOverModal
          isWon={isWon}
          score={score}
          state={state}
          onRestart={resetGame}
          onNewScenario={() => setShowScenarioSelector(true)}
        />
      )}

      {/* Scenario Selector Modal */}
      {showScenarioSelector && (
        <ScenarioSelectorModal
          currentScenario={state.scenario?.id ?? null}
          onSelect={handleSelectScenario}
          onClose={() => setShowScenarioSelector(false)}
        />
      )}

      {/* Main Layout */}
      <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--g-base)', color: 'var(--g-txt-1)' }}>
        {/* Top Bar */}
        <TopBar
          headlines={newsItems}
          spxLevel={state.financial.spxLevel}
          btcPrice={state.financial.btcPrice}
          fedFundsRate={state.financial.fedFundsRate}
          yield10y={state.financial.yield10y}
          showBreaking={activeEvents.some((e) => e.severity === 'crisis')}
          breakingMessage={activeEvents.find((e) => e.severity === 'crisis')?.headline}
          onHelp={() => setShowOnboarding(true)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Metrics */}
          <LeftSidebar state={state} score={score} />

          {/* Center */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Chart header bar — like TradingView symbol bar */}
            <div className="flex items-center gap-4 px-4 py-2 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--g-border)', background: 'var(--g-base)' }}>
              <span className="font-black text-sm" style={{ fontFamily: 'var(--g-font-display)', color: 'var(--g-txt-1)' }}>
                {state.scenario?.name ?? 'Sandbox Mode'}
              </span>
              <span className="g-label">Meeting {state.turn} / {state.maxTurns}</span>
              {/* Economic regime badge */}
              <span className="g-label px-2 py-0.5 rounded-sm" title={regime.description}
                style={{ color: regime.color, background: regime.bg }}>
                {regime.shortName}
              </span>

              {state.turn > 0 && (
                <span className="g-label px-2 py-0.5 rounded-sm"
                  style={{ color: 'var(--g-up)', background: 'rgba(38,166,154,0.1)' }}>
                  Grade: {scoreToGrade(score.overall)} · {score.overall.toFixed(0)}
                </span>
              )}
              {isFirstTurn && fomcRecommendation && (
                <span className="g-label px-2 py-0.5 rounded-sm ml-auto"
                  style={{ color: 'var(--g-brand)', background: 'rgba(41,98,255,0.1)', border: '1px solid rgba(41,98,255,0.2)' }}>
                  👇 Committee recommends: <strong>{fomcRecommendation.toUpperCase()}</strong> — press that button below
                </span>
              )}
            </div>

            {/* Hero chart */}
            <div className="flex-shrink-0" style={{ borderBottom: '1px solid var(--g-border)' }}>
              <FedSimChart data={buildCandles(state)} height={380} isDark={isDark} />
            </div>

            {/* Scrollable lower section */}
            <div className="flex-1 overflow-auto">
              {/* Scenario Briefing — only on turn 0 */}
              {state.scenario && state.turn === 0 && (
                <div className="mx-4 mt-4 p-4 rounded-sm"
                  style={{ background: 'rgba(41,98,255,0.04)', border: '1px solid rgba(41,98,255,0.15)', borderLeft: '3px solid var(--g-brand)' }}>
                  <div className="text-xs font-bold mb-1" style={{ color: 'var(--g-brand)', fontFamily: 'var(--g-font-data)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Briefing
                  </div>
                  <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: 'var(--g-txt-2)', fontFamily: 'var(--g-font-data)' }}>
                    {state.scenario.briefing}
                  </p>
                </div>
              )}

              {/* Economy at a Glance */}
              <div className="p-4">
                <EconomyAtAGlance state={state} />
              </div>

              {/* Policy buttons */}
              <div className="px-4 pb-4">
                <BottomBar
                  onRaise={handleRaise}
                  onCut={handleCut}
                  onHold={handleHold}
                  onQE={handleQE}
                  onQT={handleQT}
                  disabled={!isPlaying}
                  recommendation={fomcRecommendation}
                  fedEarned={fedEarned}
                />
              </div>

              {/* Decision Journal */}
              <div className="px-4 pb-4">
                <DecisionJournal state={state} />
              </div>

              {/* Change Scenario */}
              <div className="pb-4 text-center">
                <button onClick={() => setShowScenarioSelector(true)}
                  className="g-label hover:underline transition-colors">
                  Change Scenario
                </button>
              </div>
            </div>{/* end scrollable */}
          </div>{/* end center col */}

          {/* Right Sidebar */}
          <RightSidebar
            state={state}
            lastMeeting={lastMeeting}
            activeEvents={activeEvents}
            headlines={newsItems}
          />
        </div>
      </div>
    </>
  )
}

// ============================================================================
// MODAL COMPONENTS
// ============================================================================

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: number }) {
  const pct = Math.round(value)
  const color = value >= 75 ? 'var(--g-up)' : value >= 50 ? 'var(--g-brand)' : value >= 30 ? 'var(--g-warn)' : 'var(--g-down)'
  return (
    <div className="mb-2">
      <div className="flex justify-between mb-0.5">
        <span className="g-label">{label}</span>
        <span className="g-label" style={{ color }}>{pct} <span style={{ color: 'var(--g-txt-3)' }}>({Math.round(weight * 100)}% weight)</span></span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--g-raised)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function GameOverModal({
  isWon,
  score,
  state,
  onRestart,
  onNewScenario,
}: {
  isWon: boolean
  score: ReturnType<typeof useGameEngine>['score']
  state: GameState
  onRestart: () => void
  onNewScenario: () => void
}) {
  const grade = scoreToGrade(score.overall)
  const gradeColor = gradeToColor(grade)
  const chair = compareToChairs(score.overall)

  const peakInflation = state.history.length > 0 ? Math.max(...state.history.map(h => h.macro.coreInflation)) : state.macro.coreInflation
  const peakUnemp     = state.history.length > 0 ? Math.max(...state.history.map(h => h.macro.unemploymentRate)) : state.macro.unemploymentRate
  const hadRecession  = state.history.some(h => h.macro.gdpGrowth < 0)
  const softLanding   = score.softLandingBonus > 0

  const verdict = isWon
    ? softLanding
      ? 'Rare soft landing achieved. You cut rates without triggering a recession — the hardest act in central banking.'
      : 'Mandate fulfilled. Price stability and maximum employment maintained across the business cycle.'
    : score.overall >= 60
    ? 'Close, but instability crept in. A few better-timed moves could have changed the outcome.'
    : score.overall >= 40
    ? 'The economy struggled under your watch. Inflation and unemployment pulled in opposite directions.'
    : 'Economic crisis. Policy was too aggressive, too passive, or too late. Start again — the Fed always gets another meeting.'

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto py-8">
      <div className="g-panel w-full max-w-lg mx-4 overflow-hidden"
        style={{ border: `1px solid ${isWon ? 'var(--g-up)' : 'var(--g-down)'}30`, boxShadow: `0 0 64px ${isWon ? 'var(--g-up)' : 'var(--g-down)'}15` }}>

        {/* Top color bar */}
        <div className="h-1 w-full" style={{ background: isWon ? 'var(--g-up)' : 'var(--g-down)' }} />

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between"
          style={{ borderBottom: '1px solid var(--g-border)' }}>
          <div>
            <h2 className="font-black mb-1" style={{ fontFamily: 'var(--g-font-display)', fontSize: 22, color: isWon ? 'var(--g-up)' : 'var(--g-down)' }}>
              {isWon ? '✓ Mandate Fulfilled' : '✕ Game Over'}
            </h2>
            <p className="text-xs leading-relaxed max-w-xs" style={{ color: 'var(--g-txt-2)', fontFamily: 'var(--g-font-data)' }}>
              {verdict}
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-5xl font-black" style={{ fontFamily: 'var(--g-font-display)', color: gradeColor, textShadow: `0 0 20px ${gradeColor}60`, lineHeight: 1 }}>{grade}</div>
            <div className="text-sm font-bold tabular-nums mt-1" style={{ color: 'var(--g-txt-2)', fontFamily: 'var(--g-font-data)' }}>
              {score.overall.toFixed(1)} / 100
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--g-border)' }}>
          <div className="g-label mb-3">Mandate Scorecard</div>
          <ScoreBar label="Price Stability"       value={score.priceStability}     weight={0.30} />
          <ScoreBar label="Employment"             value={score.employment}          weight={0.25} />
          <ScoreBar label="Financial Stability"    value={score.financialStability}  weight={0.20} />
          <ScoreBar label="Fed Credibility"        value={score.credibility}         weight={0.15} />
          <ScoreBar label="Growth"                 value={score.growth}              weight={0.10} />
        </div>

        {/* Bonuses/penalties */}
        {(score.softLandingBonus > 0 || score.crisisBonus > 0 || score.recessionPenalty > 0 || score.inflationSpikePenalty > 0) && (
          <div className="px-6 py-3" style={{ borderBottom: '1px solid var(--g-border)', background: 'var(--g-raised)' }}>
            <div className="g-label mb-2">Adjustments</div>
            <div className="space-y-1">
              {score.softLandingBonus > 0 && (
                <div className="flex justify-between text-xs" style={{ fontFamily: 'var(--g-font-data)' }}>
                  <span style={{ color: 'var(--g-up)' }}>+ Soft Landing Bonus</span>
                  <span className="font-bold tabular-nums" style={{ color: 'var(--g-up)' }}>+{score.softLandingBonus.toFixed(1)}</span>
                </div>
              )}
              {score.crisisBonus > 0 && (
                <div className="flex justify-between text-xs" style={{ fontFamily: 'var(--g-font-data)' }}>
                  <span style={{ color: 'var(--g-up)' }}>+ Crisis Management</span>
                  <span className="font-bold tabular-nums" style={{ color: 'var(--g-up)' }}>+{score.crisisBonus.toFixed(1)}</span>
                </div>
              )}
              {score.recessionPenalty > 0 && (
                <div className="flex justify-between text-xs" style={{ fontFamily: 'var(--g-font-data)' }}>
                  <span style={{ color: 'var(--g-down)' }}>− Recession</span>
                  <span className="font-bold tabular-nums" style={{ color: 'var(--g-down)' }}>−{score.recessionPenalty.toFixed(1)}</span>
                </div>
              )}
              {score.inflationSpikePenalty > 0 && (
                <div className="flex justify-between text-xs" style={{ fontFamily: 'var(--g-font-data)' }}>
                  <span style={{ color: 'var(--g-down)' }}>− Inflation Spike</span>
                  <span className="font-bold tabular-nums" style={{ color: 'var(--g-down)' }}>−{score.inflationSpikePenalty.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key stats */}
        <div className="px-6 py-3 grid grid-cols-3 gap-3" style={{ borderBottom: '1px solid var(--g-border)' }}>
          <div className="text-center">
            <div className="g-label mb-1">Meetings</div>
            <div className="text-lg font-black tabular-nums" style={{ fontFamily: 'var(--g-font-display)', color: 'var(--g-txt-1)' }}>{state.turn}</div>
          </div>
          <div className="text-center">
            <div className="g-label mb-1">Peak Inflation</div>
            <div className="text-lg font-black tabular-nums" style={{ fontFamily: 'var(--g-font-display)', color: peakInflation > 4 ? 'var(--g-down)' : 'var(--g-txt-1)' }}>{peakInflation.toFixed(1)}%</div>
          </div>
          <div className="text-center">
            <div className="g-label mb-1">Peak Unemp.</div>
            <div className="text-lg font-black tabular-nums" style={{ fontFamily: 'var(--g-font-display)', color: peakUnemp > 6 ? 'var(--g-down)' : 'var(--g-txt-1)' }}>{peakUnemp.toFixed(1)}%</div>
          </div>
        </div>

        {/* Badges */}
        {(softLanding || hadRecession) && (
          <div className="px-6 py-3 flex gap-2" style={{ borderBottom: '1px solid var(--g-border)' }}>
            {softLanding && (
              <span className="text-xs font-bold px-2 py-1 rounded-sm" style={{ background: 'rgba(38,166,154,0.1)', color: 'var(--g-up)', border: '1px solid rgba(38,166,154,0.25)', fontFamily: 'var(--g-font-data)' }}>
                ✦ Soft Landing
              </span>
            )}
            {hadRecession && (
              <span className="text-xs font-bold px-2 py-1 rounded-sm" style={{ background: 'rgba(239,83,80,0.1)', color: 'var(--g-down)', border: '1px solid rgba(239,83,80,0.25)', fontFamily: 'var(--g-font-data)' }}>
                ✕ Recession
              </span>
            )}
          </div>
        )}

        {/* Historical chair comparison */}
        {chair && (
          <div className="px-6 py-3" style={{ borderBottom: '1px solid var(--g-border)', background: 'var(--g-raised)' }}>
            <div className="g-label mb-1.5">Closest Historical Comparison</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-black" style={{ color: 'var(--g-txt-1)', fontFamily: 'var(--g-font-data)' }}>{chair.name}</div>
                <div className="text-[10px]" style={{ color: 'var(--g-txt-3)', fontFamily: 'var(--g-font-data)' }}>{chair.tenure} · Est. score {chair.score}</div>
                {chair.crises.length > 0 && (
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--g-warn)' }}>Crises: {chair.crises.join(', ')}</div>
                )}
              </div>
              <div className="text-2xl font-black" style={{ fontFamily: 'var(--g-font-display)', color: gradeToColor(scoreToGrade(chair.score)) }}>
                {scoreToGrade(chair.score)}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3">
          <button onClick={onRestart}
            className="flex-1 py-3 rounded-sm font-black text-sm text-white transition-all hover:brightness-110"
            style={{ fontFamily: 'var(--g-font-display)', background: 'var(--g-brand)' }}>
            Play Again
          </button>
          <button onClick={onNewScenario}
            className="flex-1 py-3 rounded-sm font-black text-sm transition-all hover:brightness-110"
            style={{ fontFamily: 'var(--g-font-display)', background: 'var(--g-raised)', border: '1px solid var(--g-border-bright)', color: 'var(--g-txt-1)' }}>
            New Scenario
          </button>
        </div>
      </div>
    </div>
  )
}

function ScenarioSelectorModal({
  currentScenario,
  onSelect,
  onClose,
}: {
  currentScenario: string | null
  onSelect: (scenarioId: string) => void
  onClose: () => void
}) {
  const scenarios = Object.values(SCENARIOS)

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="g-panel max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col" style={{ border: '1px solid var(--g-border-bright)' }}>
        <div className="flex justify-between items-center px-4 py-3" style={{ borderBottom: '1px solid var(--g-border)' }}>
          <span className="g-data">Select Scenario</span>
          <button onClick={onClose} className="g-label hover:text-white transition-colors">✕</button>
        </div>
        <div className="p-3 overflow-y-auto space-y-2">
          {scenarios.map(s => (
            <button key={s.id} onClick={() => onSelect(s.id)}
              className="w-full text-left p-3 rounded-sm transition-all"
              style={{
                background: currentScenario === s.id ? 'rgba(59,130,246,0.15)' : 'var(--g-raised)',
                border: `1px solid ${currentScenario === s.id ? 'var(--g-info)' : 'var(--g-border)'}`,
              }}>
              <div className="g-data text-xs mb-0.5">{s.name}</div>
              <div className="g-caption text-xs">{s.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

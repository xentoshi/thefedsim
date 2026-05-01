// src/hooks/useGameEngine.ts
// React hook wrapper for the pure game engine

'use client'

import { useState, useCallback, useMemo, createContext, useContext, ReactNode } from 'react'
import {
  GameEngine,
  createGame,
  createSandboxGame,
  loadGame,
  GameState,
  PolicyAction,
  SimplePolicyAction,
  ActionResult,
  NewsItem,
  FomcMeeting,
  GameEvent,
  PolicyScore,
} from '@/engine'

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

export type UseGameEngineReturn = {
  // State
  state: GameState
  isPlaying: boolean
  isWon: boolean
  isLost: boolean

  // Derived state
  currentNews: NewsItem[]
  activeEvents: GameEvent[]
  lastMeeting: FomcMeeting | null
  score: PolicyScore

  // Actions
  executeAction: (action: PolicyAction | SimplePolicyAction) => ActionResult
  quickAction: (action: SimplePolicyAction) => ActionResult
  raiseRates: (bps?: 25 | 50 | 75) => ActionResult
  cutRates: (bps?: 25 | 50 | 75) => ActionResult
  holdRates: () => ActionResult
  startQE: (amount?: number) => ActionResult
  startQT: (amount?: number) => ActionResult

  // Game control
  startGame: (scenarioId?: string, seed?: number) => void
  resetGame: () => void
  saveGame: () => string
  loadGame: (saveData: string) => void

  // Last action result
  lastResult: ActionResult | null
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useGameEngine(
  initialScenarioId?: string,
  initialSeed?: number
): UseGameEngineReturn {
  // Game engine instance
  const [engine, setEngine] = useState<GameEngine>(() => {
    if (initialScenarioId) {
      return createGame(initialScenarioId, initialSeed)
    }
    return createSandboxGame(initialSeed)
  })

  // Reactive state (updates on each action)
  const [state, setState] = useState<GameState>(() => engine.getState())

  // Track last action result for UI feedback
  const [lastResult, setLastResult] = useState<ActionResult | null>(null)

  // News state (persists between turns for ticker)
  const [currentNews, setCurrentNews] = useState<NewsItem[]>([])

  // ========== DERIVED STATE ==========

  const isPlaying = state.status === 'playing'
  const isWon = state.status === 'won'
  const isLost = state.status === 'lost'

  const activeEvents = useMemo(
    () => state.activeEvents.filter(ae => !ae.resolved).map(ae => ae.event),
    [state.activeEvents]
  )

  const lastMeeting = useMemo(
    () => state.meetingHistory[state.meetingHistory.length - 1] ?? null,
    [state.meetingHistory]
  )

  // ========== ACTIONS ==========

  const executeAction = useCallback(
    (action: PolicyAction | SimplePolicyAction): ActionResult => {
      const result = engine.executeAction(action)
      setState(result.newState)
      setLastResult(result)

      if (result.success && result.news.length > 0) {
        // Generate news items from headlines
        const newsItems: NewsItem[] = result.news.map((headline, i) => ({
          id: `${state.turn}_${i}`,
          timestamp: new Date(),
          headline,
          category: 'economy' as const,
          sentiment: 'neutral' as const,
        }))
        setCurrentNews(prev => [...newsItems, ...prev].slice(0, 20))
      }

      return result
    },
    [engine, state.turn]
  )

  const quickAction = useCallback(
    (action: SimplePolicyAction): ActionResult => {
      return executeAction(action)
    },
    [executeAction]
  )

  const raiseRates = useCallback(
    (bps: 25 | 50 | 75 = 25): ActionResult => {
      return executeAction({ type: 'rate', direction: 'raise', magnitude: bps })
    },
    [executeAction]
  )

  const cutRates = useCallback(
    (bps: 25 | 50 | 75 = 25): ActionResult => {
      return executeAction({ type: 'rate', direction: 'cut', magnitude: bps })
    },
    [executeAction]
  )

  const holdRates = useCallback((): ActionResult => {
    return executeAction({ type: 'rate', direction: 'hold', magnitude: 25 })
  }, [executeAction])

  const startQE = useCallback(
    (amount: number = 50): ActionResult => {
      return executeAction({ type: 'balance_sheet', operation: 'qe', asset: 'both', amount })
    },
    [executeAction]
  )

  const startQT = useCallback(
    (amount: number = 50): ActionResult => {
      return executeAction({ type: 'balance_sheet', operation: 'qt', asset: 'both', amount })
    },
    [executeAction]
  )

  // ========== GAME CONTROL ==========

  const startGame = useCallback(
    (scenarioId?: string, seed?: number) => {
      const newEngine = scenarioId
        ? createGame(scenarioId, seed)
        : createSandboxGame(seed)
      setEngine(newEngine)
      setState(newEngine.getState())
      setCurrentNews([])
      setLastResult(null)
    },
    []
  )

  const resetGame = useCallback(() => {
    engine.reset()
    setState(engine.getState())
    setCurrentNews([])
    setLastResult(null)
  }, [engine])

  const saveGameData = useCallback((): string => {
    return engine.serialize()
  }, [engine])

  const loadGameData = useCallback((saveData: string) => {
    const loadedEngine = loadGame(saveData)
    setEngine(loadedEngine)
    setState(loadedEngine.getState())
    setCurrentNews([])
    setLastResult(null)
  }, [])

  // ========== RETURN ==========

  return {
    state,
    isPlaying,
    isWon,
    isLost,

    currentNews,
    activeEvents,
    lastMeeting,
    score: state.score,

    executeAction,
    quickAction,
    raiseRates,
    cutRates,
    holdRates,
    startQE,
    startQT,

    startGame,
    resetGame,
    saveGame: saveGameData,
    loadGame: loadGameData,

    lastResult,
  }
}

// ============================================================================
// CONTEXT (optional - for deep component trees)
// ============================================================================

const GameEngineContext = createContext<UseGameEngineReturn | null>(null)

export function GameEngineProvider({
  children,
  scenarioId,
  seed,
}: {
  children: ReactNode
  scenarioId?: string
  seed?: number
}) {
  const engine = useGameEngine(scenarioId, seed)

  return (
    <GameEngineContext.Provider value={engine}>
      {children}
    </GameEngineContext.Provider>
  )
}

export function useGameEngineContext(): UseGameEngineReturn {
  const context = useContext(GameEngineContext)
  if (!context) {
    throw new Error('useGameEngineContext must be used within a GameEngineProvider')
  }
  return context
}

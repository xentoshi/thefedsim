// src/engine/engine.ts
// Main game engine - orchestrates all subsystems
// Pure TypeScript, framework-independent, serializable state

import {
  GameState,
  GameStatus,
  PolicyAction,
  SimplePolicyAction,
  ActionResult,
  Scenario,
  seededRandom,
} from './types'

import {
  simulateMacro,
  simulateFinancial,
  updateBalanceSheet,
  updateCredibility,
  evolveExternalFactors,
} from './macro'

import {
  createAgentPool,
  simulateAgents,
  generateOrderBook,
  calculateFinancialStability,
} from './agents'

import {
  checkForEvents,
  processChainEvents,
  applyEventImpact,
  updateActiveEvents,
  createActiveEvent,
  EVENTS,
} from './events'

import {
  calculatePolicyScore,
} from './scoring'

import {
  SCENARIOS,
  DEFAULT_MACRO,
  DEFAULT_FINANCIAL,
  DEFAULT_BALANCE_SHEET,
  DEFAULT_CREDIBILITY,
  DEFAULT_EXTERNAL,
  applyScenarioInitialState,
} from './scenarios'

import {
  DEFAULT_COMMITTEE,
  simulateFomcMeeting,
} from './fomc'

import {
  generateNewsTicker,
} from './news'

// ============================================================================
// INITIAL STATE
// ============================================================================

function createInitialState(scenario?: Scenario, seed?: number): GameState {
  const gameSeed = seed ?? Math.floor(Math.random() * 1000000)
  // random is used to initialize agents, not needed in base state
  // const random = seededRandom(gameSeed)

  const baseState: GameState = {
    mode: 'sandbox',
    status: 'playing',
    scenario: null,
    turn: 0,
    maxTurns: 30,
    startDate: new Date(),
    currentDate: new Date(),

    macro: { ...DEFAULT_MACRO },
    financial: { ...DEFAULT_FINANCIAL },
    balanceSheet: { ...DEFAULT_BALANCE_SHEET },
    credibility: { ...DEFAULT_CREDIBILITY },
    external: { ...DEFAULT_EXTERNAL },

    agents: createAgentPool(),
    orderBook: {
      bids: [],
      asks: [],
      lastPrice: 4500,
      volume24h: 1000000,
    },

    activeEvents: [],
    eventHistory: [],

    committee: DEFAULT_COMMITTEE.map(m => ({ ...m })),
    meetingHistory: [],

    actionHistory: [],
    score: {
      overall: 50,
      priceStability: 50,
      employment: 50,
      financialStability: 50,
      credibility: 50,
      growth: 50,
      softLandingBonus: 0,
      crisisBonus: 0,
      recessionPenalty: 0,
      inflationSpikePenalty: 0,
      percentile: 0,
    },

    history: [],
    seed: gameSeed,
  }

  // Apply scenario if provided
  if (scenario) {
    const scenarioState = applyScenarioInitialState(scenario)
    return {
      ...baseState,
      ...scenarioState,
      scenario,
      seed: gameSeed,
    }
  }

  return baseState
}

// ============================================================================
// GAME ENGINE CLASS
// ============================================================================

export class GameEngine {
  private state: GameState
  private random: () => number

  constructor(scenario?: Scenario, seed?: number) {
    this.state = createInitialState(scenario, seed)
    this.random = seededRandom(this.state.seed)
  }

  // ========== GETTERS ==========

  getState(): GameState {
    return this.state
  }

  getTurn(): number {
    return this.state.turn
  }

  getStatus(): GameStatus {
    return this.state.status
  }

  // ========== CORE GAME LOOP ==========

  /**
   * Execute a policy action and advance the game one turn
   */
  executeAction(action: PolicyAction | SimplePolicyAction): ActionResult {
    if (this.state.status !== 'playing') {
      return {
        success: false,
        newState: this.state,
        events: [],
        news: [],
        fomcReaction: null,
      }
    }

    // Record action
    this.state.actionHistory.push({
      turn: this.state.turn,
      action,
      timestamp: new Date(),
    })

    // ========== PHASE 1: POLICY EFFECTS ==========

    // Update balance sheet
    this.state.balanceSheet = updateBalanceSheet(this.state.balanceSheet, action)

    // Simulate FOMC meeting
    const fomcMeeting = simulateFomcMeeting(this.state, this.state.committee, action)
    this.state.meetingHistory.push(fomcMeeting)

    // ========== PHASE 2: ECONOMIC SIMULATION ==========

    // Update financial conditions first (markets react immediately)
    this.state.financial = simulateFinancial({
      prevFinancial: this.state.financial,
      macro: this.state.macro,
      credibility: this.state.credibility,
      balanceSheet: this.state.balanceSheet,
      action,
      random: this.random,
    })

    // Update credibility
    const guidance = typeof action !== 'string' && action.type === 'guidance' ? action : null
    this.state.credibility = updateCredibility(
      this.state.credibility,
      this.state.macro,
      action,
      guidance
    )

    // Evolve external factors
    this.state.external = evolveExternalFactors(this.state.external, this.random)

    // Simulate macro economy
    this.state.macro = simulateMacro({
      prevMacro: this.state.macro,
      financial: this.state.financial,
      credibility: this.state.credibility,
      external: this.state.external,
      fci: this.state.financial.fci,
      action,
      random: this.random,
    })

    // ========== PHASE 3: AGENT SIMULATION ==========

    this.state.agents = simulateAgents(this.state.agents, {
      macro: this.state.macro,
      financial: this.state.financial,
      balanceSheet: this.state.balanceSheet,
      credibility: this.state.credibility,
      lastAction: action,
      random: this.random,
    })

    this.state.orderBook = generateOrderBook(
      this.state.agents,
      this.state.orderBook,
      this.random
    )

    // ========== PHASE 4: EVENTS ==========

    // Check for new events
    const newEvents = checkForEvents(this.state, this.random)

    // Process scripted events from scenario
    if (this.state.scenario) {
      const scriptedEvent = this.state.scenario.scriptedEvents.find(
        se => se.turn === this.state.turn
      )
      if (scriptedEvent && EVENTS[scriptedEvent.eventId]) {
        newEvents.push(EVENTS[scriptedEvent.eventId])
      }
    }

    // Apply event impacts and add to active events
    for (const event of newEvents) {
      const impact = applyEventImpact(this.state, event)
      Object.assign(this.state, impact)

      this.state.activeEvents.push(createActiveEvent(event, this.state.turn))
      this.state.eventHistory.push(event)

      // Check for chain events
      const chainEvents = processChainEvents(event, this.state, this.random)
      for (const chainEvent of chainEvents) {
        const chainImpact = applyEventImpact(this.state, chainEvent)
        Object.assign(this.state, chainImpact)
        this.state.activeEvents.push(createActiveEvent(chainEvent, this.state.turn))
        this.state.eventHistory.push(chainEvent)
      }
    }

    // Update active events (decrement timers)
    this.state.activeEvents = updateActiveEvents(this.state.activeEvents)

    // ========== PHASE 5: SCORING & STATE UPDATE ==========

    // Record history
    this.state.history.push({
      turn: this.state.turn,
      date: this.state.currentDate,
      macro: { ...this.state.macro },
      financial: { ...this.state.financial },
      balanceSheet: { ...this.state.balanceSheet },
      credibility: { ...this.state.credibility },
    })

    // Advance turn
    this.state.turn++
    this.state.currentDate = new Date(
      this.state.currentDate.getTime() + 6 * 7 * 24 * 60 * 60 * 1000 // ~6 weeks
    )

    // Calculate score
    this.state.score = calculatePolicyScore(this.state)

    // Check win/lose conditions
    this.checkGameEnd()

    // ========== PHASE 6: GENERATE NEWS ==========

    const news = generateNewsTicker(
      this.state,
      newEvents,
      fomcMeeting,
      this.random
    )

    return {
      success: true,
      newState: this.state,
      events: newEvents,
      news: news.map(n => n.headline),
      fomcReaction: fomcMeeting,
    }
  }

  /**
   * Check if the game has ended
   */
  private checkGameEnd(): void {
    // Check failure conditions from scenario
    if (this.state.scenario) {
      for (const failure of this.state.scenario.failureConditions) {
        if (failure.condition(this.state)) {
          this.state.status = 'lost'
          return
        }
      }
    }

    // Generic failure conditions
    if (this.state.macro.coreInflation > 15) {
      this.state.status = 'lost'
      return
    }
    if (this.state.macro.unemploymentRate > 15) {
      this.state.status = 'lost'
      return
    }
    if (this.state.credibility.overallScore < 20) {
      this.state.status = 'lost'
      return
    }

    // Check financial crisis
    const stability = calculateFinancialStability(this.state.agents, this.state.financial)
    if (stability.crisis && this.state.financial.creditSpread > 8) {
      this.state.status = 'lost'
      return
    }

    // Check win condition (reached max turns)
    if (this.state.turn >= this.state.maxTurns) {
      // Check scenario objectives
      if (this.state.scenario && this.state.scenario.objectives.length > 0) {
        const totalWeight = this.state.scenario.objectives.reduce((s, o) => s + o.weight, 0)
        const achievedWeight = this.state.scenario.objectives
          .filter(o => o.condition(this.state))
          .reduce((s, o) => s + o.weight, 0)

        this.state.status = achievedWeight / totalWeight >= 0.6 ? 'won' : 'lost'
      } else {
        // Sandbox mode - win if score > 60
        this.state.status = this.state.score.overall >= 60 ? 'won' : 'lost'
      }
    }
  }

  // ========== CONVENIENCE METHODS ==========

  /**
   * Quick action (raise/cut/hold/qe/qt)
   */
  quickAction(action: SimplePolicyAction): ActionResult {
    return this.executeAction(action)
  }

  /**
   * Set rate with specific magnitude
   */
  setRate(direction: 'raise' | 'cut' | 'hold', bps: 25 | 50 | 75 = 25): ActionResult {
    return this.executeAction({
      type: 'rate',
      direction,
      magnitude: bps,
    })
  }

  /**
   * Balance sheet operation
   */
  balanceSheetOp(
    operation: 'qe' | 'qt' | 'hold',
    asset: 'treasuries' | 'mbs' | 'both' = 'both',
    amount: number = 50
  ): ActionResult {
    return this.executeAction({
      type: 'balance_sheet',
      operation,
      asset,
      amount,
    })
  }

  /**
   * Set forward guidance
   */
  setGuidance(
    tone: 'hawkish' | 'neutral' | 'dovish',
    commitment: 'data_dependent' | 'time_based' | 'outcome_based' = 'data_dependent'
  ): ActionResult {
    return this.executeAction({
      type: 'guidance',
      tone,
      commitment,
    })
  }

  /**
   * Open/close a facility
   */
  manageFacility(
    facility: 'discount_window' | 'repo' | 'reverse_repo' | 'commercial_paper' | 'corporate_credit' | 'municipal',
    operation: 'open' | 'expand' | 'reduce' | 'close',
    amount?: number
  ): ActionResult {
    return this.executeAction({
      type: 'facility',
      facility,
      operation,
      amount,
    })
  }

  // ========== SERIALIZATION ==========

  /**
   * Export game state for saving
   */
  serialize(): string {
    return JSON.stringify(this.state, (key, value) => {
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() }
      }
      if (value instanceof Map) {
        return { __type: 'Map', value: Array.from(value.entries()) }
      }
      return value
    })
  }

  /**
   * Import game state from save
   */
  static deserialize(json: string): GameEngine {
    const state = JSON.parse(json, (key, value) => {
      if (value && typeof value === 'object' && value.__type === 'Date') {
        return new Date(value.value)
      }
      if (value && typeof value === 'object' && value.__type === 'Map') {
        return new Map(value.value)
      }
      return value
    })

    const engine = new GameEngine()
    engine.state = state
    engine.random = seededRandom(state.seed + state.turn * 1000)
    return engine
  }

  /**
   * Reset game with same or new scenario
   */
  reset(scenario?: Scenario, seed?: number): void {
    this.state = createInitialState(scenario ?? this.state.scenario ?? undefined, seed)
    this.random = seededRandom(this.state.seed)
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new game with a scenario
 */
export function createGame(scenarioId: string, seed?: number): GameEngine {
  const scenario = SCENARIOS[scenarioId]
  return new GameEngine(scenario, seed)
}

/**
 * Create a sandbox game
 */
export function createSandboxGame(seed?: number): GameEngine {
  return new GameEngine(undefined, seed)
}

/**
 * Load a saved game
 */
export function loadGame(saveData: string): GameEngine {
  return GameEngine.deserialize(saveData)
}

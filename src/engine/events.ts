// src/engine/events.ts
// Dynamic event system with event chains and probability-based triggering

import {
  GameEvent,
  ActiveEvent,
  GameState,
  EventCategory,
  EventSeverity,
  clamp,
} from './types'

// ============================================================================
// EVENT DEFINITIONS
// ============================================================================

export const EVENTS: Record<string, GameEvent> = {
  // ========== MARKET EVENTS ==========
  flash_crash: {
    id: 'flash_crash',
    name: 'Flash Crash',
    category: 'market',
    severity: 'moderate',
    description: 'Algorithmic trading triggers a sudden 5% drop in equity markets.',
    headline: 'MARKETS PLUNGE: Dow drops 1500 points in minutes',
    impact: {
      spxLevel: -0.05, // 5% drop
      consumerConfidence: -5,
      fci: -0.5,
    },
    duration: 2,
    triggerCondition: (state) => {
      // More likely when volatility is already elevated
      const baseProb = 0.02
      const volBonus = state.financial.spxVolatility > 25 ? 0.03 : 0
      return baseProb + volBonus
    },
  },

  banking_stress: {
    id: 'banking_stress',
    name: 'Regional Bank Crisis',
    category: 'market',
    severity: 'major',
    description: 'Several regional banks face deposit outflows amid concerns over bond portfolios.',
    headline: 'BANK RUN FEARS: Three regional banks halt withdrawals',
    impact: {
      fci: -1.5,
      consumerConfidence: -10,
      gdpGrowth: -0.5,
      credibility: -5,
    },
    duration: 4,
    chainEvents: ['credit_crunch'],
    triggerCondition: (state) => {
      // More likely when rates rose fast and banks have low sentiment
      const rateRise = state.financial.fedFundsRate > 4 ? 0.02 : 0
      const yieldCurveInversion = state.financial.yield2y > state.financial.yield10y ? 0.03 : 0
      return 0.01 + rateRise + yieldCurveInversion
    },
    responseOptions: [
      { label: 'Open discount window', action: { type: 'facility', facility: 'discount_window', operation: 'open', amount: 100 }, effectiveness: 0.8 },
      { label: 'Emergency rate cut', action: 'cut', effectiveness: 0.6 },
    ],
  },

  credit_crunch: {
    id: 'credit_crunch',
    name: 'Credit Crunch',
    category: 'market',
    severity: 'major',
    description: 'Banks dramatically tighten lending standards, choking off credit to businesses.',
    headline: 'CREDIT FREEZE: Banks pull back on loans as fear spreads',
    impact: {
      gdpGrowth: -1.0,
      unemploymentRate: 0.5,
      fci: -1.0,
    },
    duration: 5,
  },

  housing_bubble_pop: {
    id: 'housing_bubble_pop',
    name: 'Housing Market Crash',
    category: 'market',
    severity: 'crisis',
    description: 'Home prices begin a sustained decline as the housing bubble deflates.',
    headline: 'HOUSING COLLAPSE: Home prices fall 15% nationwide',
    impact: {
      consumerConfidence: -15,
      gdpGrowth: -1.5,
      unemploymentRate: 1.0,
      fci: -2.0,
    },
    duration: 8,
    chainEvents: ['banking_stress'],
    triggerCondition: (state) => {
      // More likely when housing prices are elevated and rates rising
      const priceRisk = state.macro.housePriceIndex > 300 ? 0.03 : 0
      const rateRisk = state.financial.fedFundsRate > 5 ? 0.02 : 0
      return 0.005 + priceRisk + rateRisk
    },
  },

  crypto_contagion: {
    id: 'crypto_contagion',
    name: 'Crypto Collapse',
    category: 'market',
    severity: 'moderate',
    description: 'Major cryptocurrency exchange fails, wiping out billions in customer funds.',
    headline: 'CRYPTO MELTDOWN: Bitcoin crashes 40% as exchange implodes',
    impact: {
      consumerConfidence: -5,
      fci: -0.3,
    },
    duration: 2,
    triggerCondition: (state) => {
      // More likely when BTC is high (bubble)
      return state.financial.btcPrice > 80000 ? 0.05 : 0.01
    },
  },

  bond_market_dislocation: {
    id: 'bond_market_dislocation',
    name: 'Treasury Market Stress',
    category: 'market',
    severity: 'major',
    description: 'Liquidity in the Treasury market dries up, causing wild yield swings.',
    headline: 'TREASURY CHAOS: 10-year yield swings 50bps in single day',
    impact: {
      fci: -1.0,
      yield10y: 0.3,
      credibility: -3,
    },
    duration: 3,
    responseOptions: [
      { label: 'Emergency repo operations', action: { type: 'facility', facility: 'repo', operation: 'expand', amount: 200 }, effectiveness: 0.9 },
      { label: 'Treasury purchases', action: 'qe', effectiveness: 0.7 },
    ],
    triggerCondition: (state) => {
      // More likely during QT or when foreign selling
      const qtRisk = state.balanceSheet.totalAssets < 7000 ? 0.02 : 0
      return 0.01 + qtRisk
    },
  },

  // ========== POLITICAL EVENTS ==========
  debt_ceiling: {
    id: 'debt_ceiling',
    name: 'Debt Ceiling Crisis',
    category: 'political',
    severity: 'major',
    description: 'Congress fails to raise the debt ceiling. Treasury extraordinary measures begin.',
    headline: 'DEFAULT RISK: Congress deadlocked on debt limit',
    impact: {
      consumerConfidence: -8,
      fci: -0.8,
      yield10y: 0.2,
      credibility: -5,
    },
    duration: 4,
    chainEvents: ['government_shutdown'],
    triggerCondition: () => 0.02, // Random political event
  },

  government_shutdown: {
    id: 'government_shutdown',
    name: 'Government Shutdown',
    category: 'political',
    severity: 'moderate',
    description: 'Federal government shuts down as budget negotiations collapse.',
    headline: 'SHUTDOWN: 800,000 federal workers furloughed',
    impact: {
      gdpGrowth: -0.3,
      consumerConfidence: -5,
    },
    duration: 3,
  },

  election_uncertainty: {
    id: 'election_uncertainty',
    name: 'Election Uncertainty',
    category: 'political',
    severity: 'moderate',
    description: 'Contested election results create policy uncertainty.',
    headline: 'ELECTION CHAOS: Markets await clarity on next administration',
    impact: {
      fci: -0.5,
      consumerConfidence: -5,
      spxLevel: -0.03,
    },
    duration: 3,
    triggerCondition: () => 0.01,
  },

  fed_independence_threat: {
    id: 'fed_independence_threat',
    name: 'Fed Independence Under Attack',
    category: 'political',
    severity: 'major',
    description: 'Political leaders publicly pressure the Fed to change course.',
    headline: 'WHITE HOUSE SLAMS FED: "Powell should be fired"',
    impact: {
      credibility: -10,
      fci: -0.3,
      dollarIndex: -2,
    },
    duration: 2,
    triggerCondition: (state) => {
      // More likely when rates are high and economy slowing
      const painLevel = state.financial.fedFundsRate > 4 && state.macro.gdpGrowth < 1 ? 0.05 : 0
      return 0.01 + painLevel
    },
  },

  // ========== GLOBAL EVENTS ==========
  oil_shock: {
    id: 'oil_shock',
    name: 'Oil Price Shock',
    category: 'global',
    severity: 'major',
    description: 'OPEC+ announces dramatic production cuts. Oil surges 30%.',
    headline: 'OIL SHOCK: Crude jumps to $120 as OPEC slashes output',
    impact: {
      oilPrice: 30,
      cpiInflation: 1.0,
      coreInflation: 0.3,
      gdpGrowth: -0.4,
      consumerConfidence: -8,
    },
    duration: 4,
    triggerCondition: () => 0.025,
  },

  pandemic: {
    id: 'pandemic',
    name: 'Pandemic Outbreak',
    category: 'global',
    severity: 'crisis',
    description: 'A new virus variant triggers global lockdowns and supply chain chaos.',
    headline: 'PANDEMIC: New variant forces renewed restrictions worldwide',
    impact: {
      gdpGrowth: -3.0,
      unemploymentRate: 2.0,
      cpiInflation: -0.5,
      consumerConfidence: -20,
      fci: -2.0,
    },
    duration: 6,
    chainEvents: ['supply_chain_crisis'],
    responseOptions: [
      { label: 'Emergency QE', action: 'qe', effectiveness: 0.7 },
      { label: 'Emergency rate cut', action: 'cut', effectiveness: 0.8 },
      { label: 'Open all facilities', action: { type: 'facility', facility: 'commercial_paper', operation: 'open', amount: 500 }, effectiveness: 0.9 },
    ],
    triggerCondition: () => 0.005, // Rare but devastating
  },

  supply_chain_crisis: {
    id: 'supply_chain_crisis',
    name: 'Supply Chain Crisis',
    category: 'global',
    severity: 'major',
    description: 'Global shipping bottlenecks cause shortages and price spikes.',
    headline: 'SUPPLY CRUNCH: Ships stranded as ports overflow',
    impact: {
      cpiInflation: 1.5,
      coreInflation: 0.5,
      gdpGrowth: -0.5,
    },
    duration: 5,
    triggerCondition: () => 0.02,
  },

  china_slowdown: {
    id: 'china_slowdown',
    name: 'China Economic Crisis',
    category: 'global',
    severity: 'major',
    description: "China's property sector collapses, dragging down global growth.",
    headline: 'CHINA CRISIS: Property giants default, growth stalls',
    impact: {
      gdpGrowth: -0.5,
      fci: -0.5,
      oilPrice: -15,
    },
    duration: 4,
    triggerCondition: () => 0.02,
  },

  trade_war: {
    id: 'trade_war',
    name: 'Trade War Escalation',
    category: 'global',
    severity: 'moderate',
    description: 'New tariffs imposed on major trading partners.',
    headline: 'TRADE WAR: 25% tariffs on $300B in imports',
    impact: {
      cpiInflation: 0.5,
      gdpGrowth: -0.3,
      consumerConfidence: -5,
    },
    duration: 4,
    triggerCondition: () => 0.02,
  },

  sovereign_debt_crisis: {
    id: 'sovereign_debt_crisis',
    name: 'European Debt Crisis',
    category: 'global',
    severity: 'major',
    description: 'Major European economy faces debt sustainability concerns.',
    headline: 'EURO CRISIS: Italy bond yields surge past 7%',
    impact: {
      fci: -0.7,
      dollarIndex: 3,
      consumerConfidence: -5,
    },
    duration: 4,
    responseOptions: [
      { label: 'Expand swap lines', action: { type: 'swap_line', operation: 'expand', counterparty: 'ecb', amount: 100 }, effectiveness: 0.8 },
    ],
    triggerCondition: () => 0.015,
  },

  currency_crisis: {
    id: 'currency_crisis',
    name: 'Emerging Market Currency Crisis',
    category: 'global',
    severity: 'moderate',
    description: 'Several emerging market currencies collapse amid capital flight.',
    headline: 'EM TURMOIL: Turkish lira, Argentine peso in freefall',
    impact: {
      dollarIndex: 4,
      fci: -0.4,
    },
    duration: 3,
    triggerCondition: (state) => {
      // More likely when Fed is hiking
      return state.financial.fedFundsRate > 4 ? 0.04 : 0.01
    },
  },

  // ========== STRUCTURAL EVENTS ==========
  ai_productivity_boom: {
    id: 'ai_productivity_boom',
    name: 'AI Productivity Surge',
    category: 'structural',
    severity: 'moderate',
    description: 'AI adoption accelerates, boosting productivity across the economy.',
    headline: 'AI REVOLUTION: Productivity growth hits 40-year high',
    impact: {
      gdpGrowth: 0.8,
      coreInflation: -0.3,
      spxLevel: 0.05,
      consumerConfidence: 5,
    },
    duration: 6,
    triggerCondition: () => 0.03,
  },

  climate_disaster: {
    id: 'climate_disaster',
    name: 'Climate Disaster',
    category: 'structural',
    severity: 'major',
    description: 'Major hurricane devastates Gulf Coast, disrupting energy production.',
    headline: 'CLIMATE CATASTROPHE: Category 5 hurricane causes $200B in damage',
    impact: {
      oilPrice: 15,
      gdpGrowth: -0.4,
      cpiInflation: 0.5,
      consumerConfidence: -8,
    },
    duration: 3,
    triggerCondition: () => 0.02,
  },

  demographic_shift: {
    id: 'demographic_shift',
    name: 'Labor Force Shock',
    category: 'structural',
    severity: 'moderate',
    description: 'Retirement wave accelerates, tightening labor markets permanently.',
    headline: 'GREAT RESIGNATION 2.0: Workers leaving at record pace',
    impact: {
      unemploymentRate: -0.5,
      coreInflation: 0.3,
    },
    duration: 8,
    triggerCondition: () => 0.01,
  },

  tech_bubble_burst: {
    id: 'tech_bubble_burst',
    name: 'Tech Sector Crash',
    category: 'structural',
    severity: 'major',
    description: 'Overvalued tech stocks collapse as growth disappoints.',
    headline: 'TECH WRECK: Nasdaq enters bear market',
    impact: {
      spxLevel: -0.12,
      consumerConfidence: -10,
      fci: -0.8,
    },
    duration: 4,
    triggerCondition: (state) => {
      // More likely when valuations stretched
      const valRisk = state.financial.equityRiskPremium < 0.03 ? 0.04 : 0
      return 0.01 + valRisk
    },
  },
}

// ============================================================================
// EVENT ENGINE
// ============================================================================

/**
 * Check for new events based on current state
 */
export function checkForEvents(
  state: GameState,
  random: () => number
): GameEvent[] {
  const triggered: GameEvent[] = []

  // Don't trigger events in first few turns (let player settle in)
  if (state.turn < 3) return triggered

  // Check each event's trigger condition
  for (const event of Object.values(EVENTS)) {
    // Skip if event is already active
    if (state.activeEvents.some(ae => ae.event.id === event.id && !ae.resolved)) {
      continue
    }

    // Skip if event was recently resolved (cooldown)
    const recentlyResolved = state.eventHistory.some(
      e => e.id === event.id && state.turn - state.eventHistory.indexOf(e) < 10
    )
    if (recentlyResolved) continue

    // Check trigger probability
    if (event.triggerCondition) {
      const probability = event.triggerCondition(state)
      if (random() < probability) {
        triggered.push(event)
      }
    }
  }

  // Limit to max 2 new events per turn
  return triggered.slice(0, 2)
}

/**
 * Process chain events (events that trigger other events)
 */
export function processChainEvents(
  triggeredEvent: GameEvent,
  state: GameState,
  random: () => number
): GameEvent[] {
  const chained: GameEvent[] = []

  if (triggeredEvent.chainEvents) {
    for (const chainedId of triggeredEvent.chainEvents) {
      // 50% chance for each chained event
      if (random() < 0.5) {
        const chainedEvent = EVENTS[chainedId]
        if (chainedEvent) {
          chained.push(chainedEvent)
        }
      }
    }
  }

  return chained
}

/**
 * Apply event impacts to game state
 */
export function applyEventImpact(
  state: GameState,
  event: GameEvent
): Partial<GameState> {
  const updates: Partial<GameState> = {}

  const impact = event.impact
  if (!impact) return updates

  // Macro updates
  const macroUpdates = { ...state.macro }
  if (impact.cpiInflation !== undefined) {
    macroUpdates.cpiInflation = clamp(state.macro.cpiInflation + impact.cpiInflation, -2, 20)
  }
  if (impact.coreInflation !== undefined) {
    macroUpdates.coreInflation = clamp(state.macro.coreInflation + impact.coreInflation, 0, 15)
  }
  if (impact.unemploymentRate !== undefined) {
    macroUpdates.unemploymentRate = clamp(state.macro.unemploymentRate + impact.unemploymentRate, 2, 15)
  }
  if (impact.gdpGrowth !== undefined) {
    macroUpdates.gdpGrowth = clamp(state.macro.gdpGrowth + impact.gdpGrowth, -10, 10)
  }
  if (impact.outputGap !== undefined) {
    macroUpdates.outputGap = clamp(state.macro.outputGap + impact.outputGap, -8, 8)
  }
  if (impact.consumerConfidence !== undefined) {
    macroUpdates.consumerConfidence = clamp(state.macro.consumerConfidence + impact.consumerConfidence, 20, 100)
  }

  // Financial updates
  const financialUpdates = { ...state.financial }
  if (impact.fci !== undefined) {
    financialUpdates.fci = clamp(state.financial.fci + impact.fci, -5, 5)
  }
  if (impact.yield10y !== undefined) {
    financialUpdates.yield10y = clamp(state.financial.yield10y + impact.yield10y, 0, 15)
  }
  if (impact.spxLevel !== undefined) {
    // Percentage change
    financialUpdates.spxLevel = clamp(state.financial.spxLevel * (1 + impact.spxLevel), 2000, 8000)
  }
  if (impact.dollarIndex !== undefined) {
    financialUpdates.dollarIndex = clamp(state.financial.dollarIndex + impact.dollarIndex, 80, 130)
  }

  // External updates
  const externalUpdates = { ...state.external }
  if (impact.oilPrice !== undefined) {
    externalUpdates.oilPrice = clamp(state.external.oilPrice + impact.oilPrice, 30, 200)
  }

  // Credibility updates
  const credibilityUpdates = { ...state.credibility }
  if (impact.credibility !== undefined) {
    credibilityUpdates.overallScore = clamp(state.credibility.overallScore + impact.credibility, 0, 100)
    credibilityUpdates.anchoringStrength = credibilityUpdates.overallScore / 100
  }

  return {
    macro: macroUpdates,
    financial: financialUpdates,
    external: externalUpdates,
    credibility: credibilityUpdates,
  }
}

/**
 * Update active events (decrement duration, mark resolved)
 */
export function updateActiveEvents(activeEvents: ActiveEvent[]): ActiveEvent[] {
  return activeEvents.map(ae => {
    if (ae.resolved) return ae

    const newRemaining = ae.remainingTurns - 1
    return {
      ...ae,
      remainingTurns: newRemaining,
      resolved: newRemaining <= 0,
    }
  })
}

/**
 * Create an active event instance
 */
export function createActiveEvent(event: GameEvent, currentTurn: number): ActiveEvent {
  return {
    event,
    startTurn: currentTurn,
    remainingTurns: event.duration,
    resolved: false,
  }
}

/**
 * Get event severity color for UI
 */
export function getEventColor(severity: EventSeverity): string {
  switch (severity) {
    case 'minor': return '#22c55e' // green
    case 'moderate': return '#eab308' // yellow
    case 'major': return '#f97316' // orange
    case 'crisis': return '#ef4444' // red
  }
}

/**
 * Get event category icon for UI
 */
export function getEventIcon(category: EventCategory): string {
  switch (category) {
    case 'market': return '📈'
    case 'political': return '🏛️'
    case 'global': return '🌍'
    case 'structural': return '⚙️'
  }
}

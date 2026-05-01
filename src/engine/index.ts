// src/engine/index.ts
// Public API for the Fed Simulator game engine

// ============================================================================
// MAIN ENGINE
// ============================================================================

export { GameEngine, createGame, createSandboxGame, loadGame } from './engine'

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Game state
  GameState,
  GameStatus,
  GameMode,
  ActionResult,

  // Policy actions
  PolicyAction,
  SimplePolicyAction,
  RateAction,
  BalanceSheetAction,
  ForwardGuidance,
  FacilityAction,
  YCCAction,
  SwapLineAction,

  // Economic state
  MacroState,
  FinancialConditions,
  BalanceSheet,
  FedCredibility,
  ExternalFactors,

  // Agents
  AgentState,
  AgentPool,
  OrderBook,

  // Events
  GameEvent,
  ActiveEvent,
  EventCategory,
  EventSeverity,

  // FOMC
  FomcMember,
  FomcMeeting,
  FomcVote,
  FomcBias,

  // Scoring
  PolicyScore,

  // Scenarios
  Scenario,

  // News
  NewsItem,

  // UI
  ChartType,
  UIState,

  // Bloomberg UI types
  CrisisLevel,
  AlertSeverity,
  Alert,
} from './types'

// ============================================================================
// UTILITIES
// ============================================================================

export {
  clamp,
  lerp,
  seededRandom,
  formatPercent,
  formatBillions,
} from './types'

// ============================================================================
// SCENARIOS
// ============================================================================

export {
  SCENARIOS,
  getAvailableScenarios,
  getScenario,
  DEFAULT_MACRO,
  DEFAULT_FINANCIAL,
  DEFAULT_BALANCE_SHEET,
  DEFAULT_CREDIBILITY,
  DEFAULT_EXTERNAL,
  generateWeeklyChallenge,
} from './scenarios'

// ============================================================================
// FOMC
// ============================================================================

export {
  DEFAULT_COMMITTEE,
  simulateFomcMeeting,
  getMemberVote,
  getMemberProjections,
  generateDotPlot,
  getFomcCalendar,
  hasPresser,
} from './fomc'

// ============================================================================
// EVENTS
// ============================================================================

export {
  EVENTS,
  checkForEvents,
  getEventColor,
  getEventIcon,
} from './events'

// ============================================================================
// SCORING
// ============================================================================

export {
  calculatePolicyScore,
  scoreToGrade,
  gradeToColor,
  compareToChairs,
  HISTORICAL_CHAIRS,
} from './scoring'

export type { Grade, FedChairComparison } from './scoring'

// ============================================================================
// AGENTS
// ============================================================================

export {
  createAgentPool,
  aggregateCreditConditions,
  aggregateRiskAppetite,
  aggregateConsumerDemand,
  aggregateBusinessInvestment,
  aggregateCapitalFlows,
  calculateFinancialStability,
} from './agents'

export type { FinancialStabilityMetrics } from './agents'

// ============================================================================
// NEWS
// ============================================================================

export {
  generateNews,
  generateEventNews,
  generateFomcNews,
  generateDataReleaseNews,
  generateNewsTicker,
} from './news'

// ============================================================================
// MACRO MODEL
// ============================================================================

export {
  calculateFCI,
  calculateYieldCurve,
  simulateMacro,
  simulateFinancial,
  updateBalanceSheet,
  updateCredibility,
  evolveExternalFactors,
} from './macro'

// src/engine/types.ts
// Pure TypeScript type definitions for the Fed Simulator game engine
// No framework dependencies - this is the foundation of the game

// ============================================================================
// POLICY ACTIONS
// ============================================================================

/** Conventional policy: Federal Funds Rate adjustment */
export type RateAction = {
  type: 'rate'
  direction: 'raise' | 'cut' | 'hold'
  magnitude: 25 | 50 | 75 // basis points
}

/** Balance sheet operations */
export type BalanceSheetAction = {
  type: 'balance_sheet'
  operation: 'qe' | 'qt' | 'hold'
  asset: 'treasuries' | 'mbs' | 'both'
  amount: number // billions per month
}

/** Forward guidance on future rate path */
export type ForwardGuidance = {
  type: 'guidance'
  tone: 'hawkish' | 'neutral' | 'dovish'
  commitment: 'data_dependent' | 'time_based' | 'outcome_based'
}

/** Emergency lending facilities */
export type FacilityAction = {
  type: 'facility'
  facility: 'discount_window' | 'repo' | 'reverse_repo' | 'commercial_paper' | 'corporate_credit' | 'municipal'
  operation: 'open' | 'expand' | 'reduce' | 'close'
  amount?: number
}

/** Yield curve control (if enabled) */
export type YCCAction = {
  type: 'ycc'
  operation: 'set' | 'adjust' | 'abandon'
  targetMaturity: '2y' | '5y' | '10y'
  targetYield: number
}

/** Swap lines with foreign central banks */
export type SwapLineAction = {
  type: 'swap_line'
  operation: 'activate' | 'expand' | 'reduce' | 'deactivate'
  counterparty: 'ecb' | 'boj' | 'boe' | 'snb' | 'boc'
  amount: number
}

/** Union of all possible policy actions */
export type PolicyAction =
  | RateAction
  | BalanceSheetAction
  | ForwardGuidance
  | FacilityAction
  | YCCAction
  | SwapLineAction

/** Simplified action for beginners / quick play */
export type SimplePolicyAction = 'raise' | 'cut' | 'hold' | 'qe' | 'qt'

// ============================================================================
// ECONOMIC STATE
// ============================================================================

/** Core macroeconomic indicators */
export type MacroState = {
  // Inflation
  cpiInflation: number // headline CPI year-over-year %
  coreInflation: number // core PCE (Fed's preferred measure)
  inflationExpectations: number // market-implied or survey-based

  // Labor market
  unemploymentRate: number
  laborForceParticipation: number
  wageGrowth: number // average hourly earnings YoY %
  jobOpeningsRate: number // JOLTS

  // Output
  gdpGrowth: number // real GDP growth annualized %
  outputGap: number // % deviation from potential GDP
  industrialProduction: number // index

  // Housing
  housePriceIndex: number // Case-Shiller index
  housingSales: number // existing home sales annualized

  // Consumer
  consumerConfidence: number // 0-100 index
  retailSalesGrowth: number // YoY %
  personalSavingsRate: number // %

  // Business
  businessInvestment: number // % of GDP
  corporateProfitGrowth: number // YoY %
  pmiManufacturing: number // 0-100, 50 = neutral
  pmiServices: number
}

/** Financial market conditions */
export type FinancialConditions = {
  // Interest rates
  fedFundsRate: number // effective federal funds rate
  discountRate: number
  primeRate: number

  // Treasury yields
  yield2y: number
  yield5y: number
  yield10y: number
  yield30y: number

  // Spreads
  creditSpread: number // corporate BBB - Treasury
  mortgageSpread: number // 30yr mortgage - 10yr Treasury
  tedSpread: number // LIBOR - T-bill (interbank stress)

  // Equity
  spxLevel: number
  spxVolatility: number // VIX
  equityRiskPremium: number

  // Dollar
  dollarIndex: number // DXY

  // Crypto (for fun)
  btcPrice: number

  // Aggregate financial conditions index (-5 to +5, 0 = neutral)
  fci: number
}

/** Fed balance sheet */
export type BalanceSheet = {
  // Assets
  treasuries: number // billions
  mbs: number // mortgage-backed securities
  repoLoans: number
  otherAssets: number

  // Liabilities
  reserves: number // bank reserves at Fed
  reverseRepos: number // RRP facility
  currency: number // physical currency in circulation
  treasuryDeposits: number // TGA

  // Derived
  totalAssets: number
  netInterestMargin: number // Fed's profitability
}

/** Fed credibility and communication */
export type FedCredibility = {
  // Overall credibility score 0-100
  overallScore: number

  // Component scores
  inflationFighting: number // track record on inflation
  forwardGuidanceAccuracy: number // did Fed follow through on guidance?
  crisisResponse: number // handled past crises well?
  independencePerception: number // perceived freedom from political pressure

  // Market's rate expectations vs Fed's
  marketRatePath: number[] // market-implied rates next 8 meetings
  fedDotMedian: number[] // Fed's communicated path

  // Credibility affects how much expectations anchor to target
  anchoringStrength: number // 0-1, how much expectations → 2%
}

/** External factors the Fed doesn't control */
export type ExternalFactors = {
  oilPrice: number // $/barrel
  commodityIndex: number
  globalGrowth: number // world GDP growth %
  chinaGrowth: number
  europeGrowth: number
  fiscalImpulse: number // government spending impact on GDP
  supplyChainStress: number // 0-100 index
  geopoliticalRisk: number // 0-100 index
}

// ============================================================================
// MARKET & AGENTS
// ============================================================================

/** Order book for simulated market */
export type OrderBook = {
  bids: Array<{ price: number; size: number; agent: string }>
  asks: Array<{ price: number; size: number; agent: string }>
  lastPrice: number
  volume24h: number
}

/** Individual economic agent */
export type AgentState = {
  id: string
  type: 'bank' | 'investor' | 'consumer' | 'firm' | 'foreign'

  // Agent-specific state
  riskAppetite: number // 0-1
  cashPosition: number
  exposure: number // bonds, loans, etc depending on type
  sentiment: number // -1 to 1
  memory: number[] // tracks recent Fed actions for adaptation
}

/** Collection of all agents in simulation */
export type AgentPool = {
  banks: AgentState[]
  investors: AgentState[]
  consumers: AgentState[]
  firms: AgentState[]
  foreign: AgentState[]
}

// ============================================================================
// EVENTS
// ============================================================================

export type EventCategory = 'market' | 'political' | 'global' | 'structural'

export type EventSeverity = 'minor' | 'moderate' | 'major' | 'crisis'

/** A game event that affects the economy */
export type GameEvent = {
  id: string
  name: string
  category: EventCategory
  severity: EventSeverity
  description: string
  headline: string // news headline for UI

  // Effects on the economy
  impact: Partial<{
    cpiInflation: number
    coreInflation: number
    unemploymentRate: number
    gdpGrowth: number
    outputGap: number
    consumerConfidence: number
    fci: number
    oilPrice: number
    credibility: number
    spxLevel: number // percent change
    yield10y: number // absolute change
    dollarIndex: number
  }>

  // Duration in turns (-1 = permanent until resolved)
  duration: number

  // Can trigger other events
  chainEvents?: string[]

  // Probability of occurring given conditions (evaluated each turn)
  triggerCondition?: (state: GameState) => number

  // Response options for player
  responseOptions?: Array<{
    label: string
    action: PolicyAction | SimplePolicyAction
    effectiveness: number // 0-1
  }>
}

/** Active event instance in game */
export type ActiveEvent = {
  event: GameEvent
  startTurn: number
  remainingTurns: number
  resolved: boolean
}

// ============================================================================
// FOMC
// ============================================================================

export type FomcBias = 'hawk' | 'dove' | 'centrist'

export type FomcVote = 'raise' | 'cut' | 'hold' | 'qe' | 'qt'

/** Individual FOMC member */
export type FomcMember = {
  id: string
  name: string
  title: string
  bias: FomcBias
  weight: number // voting weight (Chair has more influence)
  dissenter: boolean // prone to dissenting
  rateProjection: { [year: string]: number } // dot plot projections
}

/** FOMC meeting result */
export type FomcMeeting = {
  turn: number
  votes: Map<string, FomcVote>
  decision: FomcVote
  dissenters: string[]
  statement: string
  pressConferenceTone: 'hawkish' | 'balanced' | 'dovish'
}

// ============================================================================
// SCORING
// ============================================================================

/** Detailed policy score breakdown */
export type PolicyScore = {
  // Overall 0-100
  overall: number

  // Components (each 0-100)
  priceStability: number // deviation from 2% target
  employment: number // unemployment vs NAIRU
  financialStability: number // no crises, low volatility
  credibility: number // trust maintained
  growth: number // GDP trajectory

  // Bonus/penalties
  softLandingBonus: number // reduced rates without recession
  crisisBonus: number // survived a crisis
  recessionPenalty: number
  inflationSpikePenalty: number

  // Historical comparison
  percentile: number // vs other players
}

// ============================================================================
// GAME STATE
// ============================================================================

export type GameMode = 'campaign' | 'sandbox' | 'challenge'

export type GameStatus = 'playing' | 'won' | 'lost' | 'paused'

/** A campaign scenario */
export type Scenario = {
  id: string
  name: string
  description: string
  briefing: string // narrative intro
  year: number
  duration: number // number of FOMC meetings

  // Starting conditions
  initialState: Partial<GameState>

  // Win/lose conditions
  objectives: Array<{
    description: string
    condition: (state: GameState) => boolean
    weight: number // importance 0-1
  }>

  failureConditions: Array<{
    description: string
    condition: (state: GameState) => boolean
  }>

  // Scripted events for this scenario
  scriptedEvents: Array<{
    turn: number
    eventId: string
  }>

  // Unlocks
  requiresCompletion?: string[] // scenario IDs
  unlocksTools?: string[] // tools unlocked after completion
}

/** Full game state - everything needed to render and simulate */
export type GameState = {
  // Meta
  mode: GameMode
  status: GameStatus
  scenario: Scenario | null
  turn: number
  maxTurns: number
  startDate: Date
  currentDate: Date // simulated date

  // Economic state
  macro: MacroState
  financial: FinancialConditions
  balanceSheet: BalanceSheet
  credibility: FedCredibility
  external: ExternalFactors

  // Market simulation
  agents: AgentPool
  orderBook: OrderBook

  // Events
  activeEvents: ActiveEvent[]
  eventHistory: GameEvent[]

  // FOMC
  committee: FomcMember[]
  meetingHistory: FomcMeeting[]

  // Player actions
  actionHistory: Array<{
    turn: number
    action: PolicyAction | SimplePolicyAction
    timestamp: Date
  }>

  // Scoring
  score: PolicyScore

  // History for charts
  history: Array<{
    turn: number
    date: Date
    macro: MacroState
    financial: FinancialConditions
    balanceSheet: BalanceSheet
    credibility: FedCredibility
  }>

  // Random seed for reproducibility (challenges)
  seed: number
}

// ============================================================================
// ENGINE API
// ============================================================================

/** Result of applying an action */
export type ActionResult = {
  success: boolean
  newState: GameState
  events: GameEvent[] // events triggered by this action
  news: string[] // headlines generated
  fomcReaction: FomcMeeting | null // if action was a rate decision
}

/** News headline for UI */
export type NewsItem = {
  id: string
  timestamp: Date
  headline: string
  category: 'fed' | 'economy' | 'markets' | 'politics' | 'global'
  sentiment: 'positive' | 'negative' | 'neutral'
}

// ============================================================================
// UI STATE (separate from game logic)
// ============================================================================

export type ChartType = 'macro' | 'rates' | 'yieldCurve' | 'balanceSheet' | 'markets' | 'dotPlot'

export type UIState = {
  selectedChart: ChartType
  showNews: boolean
  showFomcPanel: boolean
  tutorialStep: number | null
  isPaused: boolean
}

// ============================================================================
// BLOOMBERG UI TYPES
// ============================================================================

export type CrisisLevel = 'none' | 'warning' | 'critical' | 'emergency'

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'breaking'

export type Alert = {
  id: string
  message: string
  severity: AlertSeverity
  timestamp: Date
  category: EventCategory
  autoDismiss?: boolean
  duration?: number
}

// ============================================================================
// UTILITIES
// ============================================================================

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Seeded random number generator */
export function seededRandom(seed: number): () => number {
  return function () {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

/** Format number as percentage */
export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

/** Format number as currency (billions) */
export function formatBillions(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}T`
  }
  return `$${value.toFixed(0)}B`
}

// src/engine/agents.ts
// Agent-based market simulation
// Agents respond to economic conditions and create emergent behavior

import {
  AgentState,
  AgentPool,
  MacroState,
  FinancialConditions,
  BalanceSheet,
  FedCredibility,
  PolicyAction,
  SimplePolicyAction,
  OrderBook,
  clamp,
} from './types'

// ============================================================================
// AGENT CREATION
// ============================================================================

function createAgent(
  id: string,
  type: AgentState['type'],
  riskAppetite: number,
  initialCash: number
): AgentState {
  return {
    id,
    type,
    riskAppetite,
    cashPosition: initialCash,
    exposure: 0,
    sentiment: 0,
    memory: [],
  }
}

/**
 * Initialize the agent pool with diverse agents
 */
export function createAgentPool(): AgentPool {
  return {
    banks: [
      createAgent('jpmorgan', 'bank', 0.6, 500),
      createAgent('bofa', 'bank', 0.5, 400),
      createAgent('citi', 'bank', 0.55, 350),
      createAgent('wells', 'bank', 0.45, 300),
      createAgent('goldman', 'bank', 0.7, 250),
      createAgent('morgan', 'bank', 0.65, 280),
      createAgent('regional_1', 'bank', 0.4, 100),
      createAgent('regional_2', 'bank', 0.35, 80),
    ],
    investors: [
      createAgent('blackrock', 'investor', 0.5, 1000),
      createAgent('vanguard', 'investor', 0.4, 900),
      createAgent('fidelity', 'investor', 0.45, 600),
      createAgent('pension_fund', 'investor', 0.3, 500),
      createAgent('hedge_fund_1', 'investor', 0.8, 200),
      createAgent('hedge_fund_2', 'investor', 0.85, 150),
      createAgent('sovereign_wealth', 'investor', 0.35, 800),
      createAgent('retail_aggregate', 'investor', 0.6, 300),
    ],
    consumers: [
      createAgent('high_income', 'consumer', 0.5, 100),
      createAgent('middle_income', 'consumer', 0.4, 50),
      createAgent('low_income', 'consumer', 0.3, 20),
    ],
    firms: [
      createAgent('tech_large', 'firm', 0.6, 200),
      createAgent('tech_small', 'firm', 0.7, 50),
      createAgent('manufacturing', 'firm', 0.4, 150),
      createAgent('retail', 'firm', 0.45, 80),
      createAgent('energy', 'firm', 0.5, 120),
      createAgent('financials', 'firm', 0.55, 100),
    ],
    foreign: [
      createAgent('ecb', 'foreign', 0.4, 300),
      createAgent('boj', 'foreign', 0.35, 400),
      createAgent('pboc', 'foreign', 0.5, 500),
      createAgent('emerging', 'foreign', 0.6, 200),
    ],
  }
}

// ============================================================================
// AGENT BEHAVIOR
// ============================================================================

type AgentContext = {
  macro: MacroState
  financial: FinancialConditions
  balanceSheet: BalanceSheet
  credibility: FedCredibility
  lastAction: PolicyAction | SimplePolicyAction | null
  random: () => number
}

/**
 * Update agent memory with recent Fed action
 * Memory affects how agents react (they adapt to Fed behavior)
 */
function updateMemory(agent: AgentState, action: PolicyAction | SimplePolicyAction | null): number[] {
  const memory = [...agent.memory]

  // Encode action as number (-1 = dovish, 0 = neutral, +1 = hawkish)
  let actionValue = 0
  if (action) {
    if (typeof action === 'string') {
      if (action === 'raise' || action === 'qt') actionValue = 1
      if (action === 'cut' || action === 'qe') actionValue = -1
    } else if (action.type === 'rate') {
      actionValue = action.direction === 'raise' ? 1 : action.direction === 'cut' ? -1 : 0
    }
  }

  memory.push(actionValue)

  // Keep last 8 actions
  if (memory.length > 8) memory.shift()

  return memory
}

/**
 * Calculate perceived Fed stance from memory
 * Agents that remember hawkish Fed are more cautious
 */
function perceivedFedStance(memory: number[]): number {
  if (memory.length === 0) return 0
  const sum = memory.reduce((a, b) => a + b, 0)
  return sum / memory.length // -1 to 1
}

/**
 * Bank agent behavior
 * - Extend credit based on spreads and risk appetite
 * - React to Fed policy with lending adjustments
 */
function simulateBankAgent(agent: AgentState, ctx: AgentContext): AgentState {
  const next = { ...agent }
  next.memory = updateMemory(agent, ctx.lastAction)

  const fedStance = perceivedFedStance(next.memory)

  // Net interest margin opportunity
  const spreadOpportunity = ctx.financial.creditSpread - 1 // baseline spread

  // Risk assessment
  const defaultRisk = (ctx.macro.unemploymentRate - 4) * 0.1 // higher unemployment = more defaults
  const economicOutlook = ctx.macro.gdpGrowth / 5 // -2 to 2 normalized

  // Banks tighten when Fed is hawkish (they expect slowdown)
  const fedEffect = -fedStance * 0.2

  // Sentiment update
  next.sentiment = clamp(
    0.4 * spreadOpportunity + 0.3 * economicOutlook + 0.2 * fedEffect - 0.3 * defaultRisk,
    -1,
    1
  )

  // Exposure = lending. Positive sentiment = more lending
  const lendingAdjustment = next.sentiment * next.riskAppetite * 50 + (ctx.random() - 0.5) * 10
  next.exposure = clamp(agent.exposure + lendingAdjustment, 0, next.cashPosition * 10)

  // Cash depletes with lending, replenishes with Fed reserves
  next.cashPosition = clamp(
    agent.cashPosition - lendingAdjustment * 0.1 + ctx.balanceSheet.reserves * 0.001,
    0,
    1000
  )

  return next
}

/**
 * Investor agent behavior
 * - Allocate between bonds, stocks, and cash
 * - Chase yield vs. seek safety
 */
function simulateInvestorAgent(agent: AgentState, ctx: AgentContext): AgentState {
  const next = { ...agent }
  next.memory = updateMemory(agent, ctx.lastAction)

  const fedStance = perceivedFedStance(next.memory)

  // Yield attractiveness
  const realYield = ctx.financial.yield10y - ctx.macro.inflationExpectations
  const yieldSignal = realYield > 1 ? 0.5 : realYield < 0 ? -0.5 : 0

  // Risk-on vs risk-off
  const vixSignal = ctx.financial.spxVolatility > 25 ? -0.5 : ctx.financial.spxVolatility < 15 ? 0.5 : 0

  // Equity valuations (simplified P/E signal)
  const equitySignal = ctx.financial.equityRiskPremium > 0.04 ? 0.3 : -0.2

  // Fed accommodation = risk on
  const fedSignal = -fedStance * 0.3 // hawkish = risk off

  // Sentiment update
  next.sentiment = clamp(
    0.25 * yieldSignal + 0.25 * vixSignal + 0.25 * equitySignal + 0.25 * fedSignal,
    -1,
    1
  )

  // Exposure = risky assets. Positive sentiment = more exposure
  const riskAdjustment = next.sentiment * next.riskAppetite * 100 + (ctx.random() - 0.5) * 20
  next.exposure = clamp(agent.exposure + riskAdjustment, 0, next.cashPosition * 5)

  return next
}

/**
 * Consumer agent behavior
 * - Spend based on wealth, employment, confidence
 * - Save when uncertain
 */
function simulateConsumerAgent(agent: AgentState, ctx: AgentContext): AgentState {
  const next = { ...agent }
  next.memory = updateMemory(agent, ctx.lastAction)

  // Employment confidence
  const jobSecurity = (5 - ctx.macro.unemploymentRate) / 5 // higher when low unemployment

  // Wealth effect (from markets)
  const wealthEffect = (ctx.financial.spxLevel - 4000) / 4000 // baseline SPX 4000

  // Inflation pain
  const inflationPain = -(ctx.macro.cpiInflation - 2) / 5 // pain above 2%

  // Real wage growth
  const realWages = (ctx.macro.wageGrowth - ctx.macro.cpiInflation) / 5

  // Sentiment
  next.sentiment = clamp(
    0.3 * jobSecurity + 0.25 * wealthEffect + 0.25 * inflationPain + 0.2 * realWages,
    -1,
    1
  )

  // Exposure = spending propensity
  next.exposure = clamp((next.sentiment + 1) * 50 * next.riskAppetite, 0, 100)

  return next
}

/**
 * Firm agent behavior
 * - Invest based on financial conditions, demand outlook
 * - Hire/fire based on output gap
 */
function simulateFirmAgent(agent: AgentState, ctx: AgentContext): AgentState {
  const next = { ...agent }
  next.memory = updateMemory(agent, ctx.lastAction)

  const fedStance = perceivedFedStance(next.memory)

  // Demand outlook
  const demandSignal = ctx.macro.outputGap / 5

  // Financing conditions
  const financingCost = -(ctx.financial.primeRate - 5) / 5 // baseline 5%

  // Profit outlook
  const profitSignal = ctx.macro.corporateProfitGrowth / 20

  // Fed accommodation
  const fedSignal = -fedStance * 0.2

  // Sentiment
  next.sentiment = clamp(
    0.3 * demandSignal + 0.25 * financingCost + 0.25 * profitSignal + 0.2 * fedSignal,
    -1,
    1
  )

  // Exposure = investment/hiring
  const investmentAdjust = next.sentiment * next.riskAppetite * 30 + (ctx.random() - 0.5) * 10
  next.exposure = clamp(agent.exposure + investmentAdjust, 0, next.cashPosition * 3)

  return next
}

/**
 * Foreign agent behavior
 * - Capital flows based on rate differentials, dollar
 * - Safe haven flows during crises
 */
function simulateForeignAgent(agent: AgentState, ctx: AgentContext): AgentState {
  const next = { ...agent }
  next.memory = updateMemory(agent, ctx.lastAction)

  // Rate differential (US vs rest of world)
  const rateDifferential = ctx.financial.fedFundsRate - 2 // assume RoW at 2%

  // Dollar attractiveness
  const dollarSignal = (ctx.financial.dollarIndex - 100) / 20

  // Safe haven demand (during stress)
  const stressSignal = ctx.financial.spxVolatility > 30 ? 0.5 : 0

  // US growth advantage
  const growthSignal = (ctx.macro.gdpGrowth - 2) / 5

  // Sentiment = desire to hold US assets
  next.sentiment = clamp(
    0.3 * rateDifferential / 3 + 0.25 * dollarSignal + 0.25 * stressSignal + 0.2 * growthSignal,
    -1,
    1
  )

  // Exposure = US asset holdings
  const flowAdjust = next.sentiment * next.riskAppetite * 50 + (ctx.random() - 0.5) * 20
  next.exposure = clamp(agent.exposure + flowAdjust, 0, next.cashPosition * 4)

  return next
}

// ============================================================================
// AGENT POOL SIMULATION
// ============================================================================

/**
 * Simulate all agents for one turn
 */
export function simulateAgents(
  pool: AgentPool,
  ctx: AgentContext
): AgentPool {
  return {
    banks: pool.banks.map(a => simulateBankAgent(a, ctx)),
    investors: pool.investors.map(a => simulateInvestorAgent(a, ctx)),
    consumers: pool.consumers.map(a => simulateConsumerAgent(a, ctx)),
    firms: pool.firms.map(a => simulateFirmAgent(a, ctx)),
    foreign: pool.foreign.map(a => simulateForeignAgent(a, ctx)),
  }
}

// ============================================================================
// AGGREGATE METRICS FROM AGENTS
// ============================================================================

/**
 * Calculate aggregate credit conditions from bank agents
 */
export function aggregateCreditConditions(banks: AgentState[]): {
  totalLending: number
  averageSentiment: number
  creditTightening: number
} {
  const totalLending = banks.reduce((sum, b) => sum + b.exposure, 0)
  const averageSentiment = banks.reduce((sum, b) => sum + b.sentiment, 0) / banks.length
  const creditTightening = averageSentiment < 0 ? -averageSentiment : 0

  return { totalLending, averageSentiment, creditTightening }
}

/**
 * Calculate aggregate risk appetite from investors
 */
export function aggregateRiskAppetite(investors: AgentState[]): {
  totalExposure: number
  averageSentiment: number
  riskOnOff: 'risk_on' | 'neutral' | 'risk_off'
} {
  const totalExposure = investors.reduce((sum, i) => sum + i.exposure, 0)
  const averageSentiment = investors.reduce((sum, i) => sum + i.sentiment, 0) / investors.length
  const riskOnOff = averageSentiment > 0.3 ? 'risk_on' : averageSentiment < -0.3 ? 'risk_off' : 'neutral'

  return { totalExposure, averageSentiment, riskOnOff }
}

/**
 * Calculate aggregate consumer demand
 */
export function aggregateConsumerDemand(consumers: AgentState[]): {
  spendingPropensity: number
  averageSentiment: number
} {
  const spendingPropensity = consumers.reduce((sum, c) => sum + c.exposure, 0) / consumers.length
  const averageSentiment = consumers.reduce((sum, c) => sum + c.sentiment, 0) / consumers.length

  return { spendingPropensity, averageSentiment }
}

/**
 * Calculate aggregate business investment
 */
export function aggregateBusinessInvestment(firms: AgentState[]): {
  investmentLevel: number
  averageSentiment: number
  hiringOutlook: 'expanding' | 'stable' | 'contracting'
} {
  const investmentLevel = firms.reduce((sum, f) => sum + f.exposure, 0)
  const averageSentiment = firms.reduce((sum, f) => sum + f.sentiment, 0) / firms.length
  const hiringOutlook = averageSentiment > 0.2 ? 'expanding' : averageSentiment < -0.2 ? 'contracting' : 'stable'

  return { investmentLevel, averageSentiment, hiringOutlook }
}

/**
 * Calculate net capital flows
 */
export function aggregateCapitalFlows(foreign: AgentState[]): {
  netInflows: number
  averageSentiment: number
  flowDirection: 'inflow' | 'neutral' | 'outflow'
} {
  const netInflows = foreign.reduce((sum, f) => sum + f.exposure, 0)
  const averageSentiment = foreign.reduce((sum, f) => sum + f.sentiment, 0) / foreign.length
  const flowDirection = averageSentiment > 0.2 ? 'inflow' : averageSentiment < -0.2 ? 'outflow' : 'neutral'

  return { netInflows, averageSentiment, flowDirection }
}

// ============================================================================
// ORDER BOOK SIMULATION
// ============================================================================

/**
 * Generate a simulated order book based on agent sentiment
 */
export function generateOrderBook(
  agents: AgentPool,
  prevOrderBook: OrderBook,
  random: () => number
): OrderBook {
  const investorSentiment = aggregateRiskAppetite(agents.investors).averageSentiment
  const foreignSentiment = aggregateCapitalFlows(agents.foreign).averageSentiment

  // Net buying pressure
  const buyPressure = (investorSentiment + foreignSentiment) / 2

  // Price impact
  const priceChange = buyPressure * 50 + (random() - 0.5) * 20
  const newPrice = clamp(prevOrderBook.lastPrice + priceChange, 100, 10000)

  // Generate order book around new price
  const spread = 0.001 + (1 - Math.abs(buyPressure)) * 0.002 // tighter spread when confident

  const bids: OrderBook['bids'] = []
  const asks: OrderBook['asks'] = []

  for (let i = 0; i < 10; i++) {
    const bidPrice = newPrice * (1 - spread * (i + 1))
    const askPrice = newPrice * (1 + spread * (i + 1))

    // Size decreases away from mid
    const baseSize = 100 * (1 + buyPressure) // more bids when bullish
    const askSize = 100 * (1 - buyPressure) // more asks when bearish

    bids.push({
      price: bidPrice,
      size: baseSize * (10 - i) / 10 + random() * 20,
      agent: agents.investors[i % agents.investors.length]?.id || 'unknown',
    })

    asks.push({
      price: askPrice,
      size: askSize * (10 - i) / 10 + random() * 20,
      agent: agents.investors[(i + 1) % agents.investors.length]?.id || 'unknown',
    })
  }

  // Volume based on activity
  const volume24h = 1000000 * (1 + Math.abs(buyPressure)) + random() * 500000

  return {
    bids,
    asks,
    lastPrice: newPrice,
    volume24h,
  }
}

// ============================================================================
// FINANCIAL STABILITY INDICATORS
// ============================================================================

export type FinancialStabilityMetrics = {
  bankingStress: number // 0-100
  marketStress: number // 0-100
  leverageRisk: number // 0-100
  liquidityRisk: number // 0-100
  overallRisk: number // 0-100
  crisis: boolean
}

/**
 * Calculate financial stability metrics from agent state
 */
export function calculateFinancialStability(
  agents: AgentPool,
  financial: FinancialConditions
): FinancialStabilityMetrics {
  const bankCredit = aggregateCreditConditions(agents.banks)
  const investorRisk = aggregateRiskAppetite(agents.investors)

  // Banking stress: negative sentiment + tight credit
  const bankingStress = clamp(
    50 + (-bankCredit.averageSentiment) * 30 + bankCredit.creditTightening * 20,
    0,
    100
  )

  // Market stress: from VIX and spreads
  const marketStress = clamp(
    (financial.spxVolatility - 15) * 2 + (financial.creditSpread - 1.5) * 10,
    0,
    100
  )

  // Leverage risk: when investors are over-exposed
  const avgExposure = investorRisk.totalExposure / agents.investors.length
  const avgCash = agents.investors.reduce((s, i) => s + i.cashPosition, 0) / agents.investors.length
  const leverageRatio = avgExposure / (avgCash + 1)
  const leverageRisk = clamp(leverageRatio * 20, 0, 100)

  // Liquidity risk: from TED spread and bank cash
  const bankCash = agents.banks.reduce((s, b) => s + b.cashPosition, 0)
  const liquidityRisk = clamp(
    financial.tedSpread * 30 + (1000 - bankCash) / 20,
    0,
    100
  )

  // Overall risk
  const overallRisk = (bankingStress + marketStress + leverageRisk + liquidityRisk) / 4

  // Crisis threshold
  const crisis = overallRisk > 70 || bankingStress > 80 || marketStress > 80

  return {
    bankingStress,
    marketStress,
    leverageRisk,
    liquidityRisk,
    overallRisk,
    crisis,
  }
}

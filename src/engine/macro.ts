// src/engine/macro.ts
// Macroeconomic simulation model
// Implements IS-LM-Phillips framework with expectations and financial conditions

import {
  MacroState,
  FinancialConditions,
  BalanceSheet,
  FedCredibility,
  ExternalFactors,
  PolicyAction,
  SimplePolicyAction,
  RateAction,
  BalanceSheetAction,
  ForwardGuidance,
  clamp,
} from './types'

// ============================================================================
// CONSTANTS
// ============================================================================

/** Natural rate of unemployment (NAIRU) */
const NAIRU = 4.5

/** Potential GDP growth */
const POTENTIAL_GROWTH = 2.0

/** Inflation target */
const INFLATION_TARGET = 2.0

/** Neutral real rate (r*) */
const NEUTRAL_RATE = 0.5

// ============================================================================
// FINANCIAL CONDITIONS INDEX
// ============================================================================

/**
 * Calculate the Financial Conditions Index (FCI)
 * Aggregates multiple financial variables into a single measure of tightness/looseness
 * Negative = tight, Positive = loose
 */
export function calculateFCI(
  financial: FinancialConditions,
  balanceSheet: BalanceSheet,
  prevFCI: number
): number {
  // Real rate (nominal minus inflation expectations)
  const realRate = financial.fedFundsRate - 2.0 // simplified

  // Yield curve slope (10y - 2y)
  const yieldCurveSlope = financial.yield10y - financial.yield2y

  // Credit conditions
  const creditTightness = financial.creditSpread - 1.5 // baseline spread

  // Equity conditions (deviation from trend)
  const equityContribution = (financial.spxLevel - 4500) / 1000 // simplified

  // Dollar strength (inverted - strong dollar = tight)
  const dollarContribution = -(financial.dollarIndex - 100) / 20

  // Balance sheet size effect
  const balanceSheetEffect = (balanceSheet.totalAssets - 7000) / 2000

  // Weighted average
  const rawFCI =
    -0.3 * realRate +
    0.15 * yieldCurveSlope +
    -0.2 * creditTightness +
    0.2 * equityContribution +
    0.1 * dollarContribution +
    0.15 * balanceSheetEffect

  // Smooth with previous value (financial conditions don't change instantly)
  const smoothedFCI = 0.7 * rawFCI + 0.3 * prevFCI

  return clamp(smoothedFCI, -5, 5)
}

// ============================================================================
// YIELD CURVE MODEL
// ============================================================================

/**
 * Calculate Treasury yields based on Fed policy, expectations, and term premia
 */
export function calculateYieldCurve(
  fedFundsRate: number,
  inflationExpectations: number,
  credibility: FedCredibility,
  gdpGrowth: number,
  balanceSheet: BalanceSheet,
  random: () => number
): { yield2y: number; yield5y: number; yield10y: number; yield30y: number } {
  // Short end anchored to Fed funds + expected path
  const expectedRatePath = (fedFundsRate + credibility.fedDotMedian[0]) / 2
  const yield2y = expectedRatePath + (random() - 0.5) * 0.1

  // Term premium increases with maturity
  // Lower when Fed is buying (QE), higher when selling (QT)
  const qeEffect = (balanceSheet.treasuries - 5000) / 10000 // negative = lower yields
  const termPremium5y = 0.3 - qeEffect * 0.15 + (random() - 0.5) * 0.05
  const termPremium10y = 0.6 - qeEffect * 0.25 + (random() - 0.5) * 0.08
  const termPremium30y = 1.0 - qeEffect * 0.3 + (random() - 0.5) * 0.1

  // Expectations component (average expected short rates)
  const expectedInflation = inflationExpectations
  const expectedRealRate = NEUTRAL_RATE + gdpGrowth * 0.1

  const yield5y = expectedRealRate + expectedInflation + termPremium5y
  const yield10y = expectedRealRate + expectedInflation + termPremium10y
  const yield30y = expectedRealRate + expectedInflation * 0.9 + termPremium30y // long-run inflation anchored

  return {
    yield2y: clamp(yield2y, 0, 15),
    yield5y: clamp(yield5y, 0, 15),
    yield10y: clamp(yield10y, 0, 15),
    yield30y: clamp(yield30y, 0, 15),
  }
}

// ============================================================================
// BALANCE SHEET MECHANICS
// ============================================================================

/**
 * Update the Fed's balance sheet based on policy actions
 */
export function updateBalanceSheet(
  prev: BalanceSheet,
  action: PolicyAction | SimplePolicyAction | null
): BalanceSheet {
  const next = { ...prev }

  if (!action) return next

  // Handle simple actions
  if (typeof action === 'string') {
    switch (action) {
      case 'qe':
        next.treasuries += 50
        next.mbs += 25
        next.reserves += 75
        break
      case 'qt':
        next.treasuries = Math.max(next.treasuries - 40, 0)
        next.mbs = Math.max(next.mbs - 20, 0)
        next.reserves = Math.max(next.reserves - 60, 0)
        break
      case 'raise':
        // Rate hikes encourage RRP usage
        next.reverseRepos += 30
        next.reserves = Math.max(next.reserves - 30, 0)
        break
      case 'cut':
        // Rate cuts reduce RRP
        next.reverseRepos = Math.max(next.reverseRepos - 30, 0)
        next.reserves += 30
        break
    }
  } else if (action.type === 'balance_sheet') {
    const bsAction = action as BalanceSheetAction
    const amount = bsAction.amount || 50

    if (bsAction.operation === 'qe') {
      if (bsAction.asset === 'treasuries' || bsAction.asset === 'both') {
        next.treasuries += amount * 0.7
      }
      if (bsAction.asset === 'mbs' || bsAction.asset === 'both') {
        next.mbs += amount * 0.3
      }
      next.reserves += amount
    } else if (bsAction.operation === 'qt') {
      if (bsAction.asset === 'treasuries' || bsAction.asset === 'both') {
        next.treasuries = Math.max(next.treasuries - amount * 0.7, 0)
      }
      if (bsAction.asset === 'mbs' || bsAction.asset === 'both') {
        next.mbs = Math.max(next.mbs - amount * 0.3, 0)
      }
      next.reserves = Math.max(next.reserves - amount, 0)
    }
  } else if (action.type === 'facility') {
    if (action.operation === 'open' || action.operation === 'expand') {
      next.repoLoans += action.amount || 50
      next.reserves += action.amount || 50
    } else if (action.operation === 'reduce' || action.operation === 'close') {
      next.repoLoans = Math.max(next.repoLoans - (action.amount || 50), 0)
      next.reserves = Math.max(next.reserves - (action.amount || 50), 0)
    }
  }

  // Update total assets
  next.totalAssets = next.treasuries + next.mbs + next.repoLoans + next.otherAssets

  // Calculate net interest margin (simplified)
  const avgYield = 0.03 // average yield on assets
  const avgCost = 0.02 // average cost of liabilities
  next.netInterestMargin = (next.totalAssets * avgYield - next.reserves * avgCost) / next.totalAssets

  return next
}

// ============================================================================
// CREDIBILITY MODEL
// ============================================================================

/**
 * Update Fed credibility based on actions and outcomes
 */
export function updateCredibility(
  prev: FedCredibility,
  macro: MacroState,
  action: PolicyAction | SimplePolicyAction | null,
  guidance: ForwardGuidance | null
): FedCredibility {
  const next = { ...prev }

  // Inflation fighting credibility
  const inflationDeviation = Math.abs(macro.coreInflation - INFLATION_TARGET)
  if (inflationDeviation < 0.5) {
    next.inflationFighting = Math.min(next.inflationFighting + 2, 100)
  } else if (inflationDeviation > 2) {
    next.inflationFighting = Math.max(next.inflationFighting - 3, 0)
  } else {
    next.inflationFighting = Math.max(next.inflationFighting - 1, 0)
  }

  // Forward guidance accuracy (did Fed do what it said?)
  // This would need history tracking - simplified here
  if (guidance) {
    // Hawkish guidance + rate raise = consistent
    if (guidance.tone === 'hawkish' && action === 'raise') {
      next.forwardGuidanceAccuracy = Math.min(next.forwardGuidanceAccuracy + 3, 100)
    }
    // Dovish guidance + rate cut = consistent
    if (guidance.tone === 'dovish' && action === 'cut') {
      next.forwardGuidanceAccuracy = Math.min(next.forwardGuidanceAccuracy + 3, 100)
    }
    // Inconsistent = credibility hit
    if (guidance.tone === 'hawkish' && action === 'cut') {
      next.forwardGuidanceAccuracy = Math.max(next.forwardGuidanceAccuracy - 5, 0)
    }
    if (guidance.tone === 'dovish' && action === 'raise') {
      next.forwardGuidanceAccuracy = Math.max(next.forwardGuidanceAccuracy - 5, 0)
    }
  }

  // Calculate overall score
  next.overallScore =
    next.inflationFighting * 0.4 +
    next.forwardGuidanceAccuracy * 0.25 +
    next.crisisResponse * 0.2 +
    next.independencePerception * 0.15

  // Anchoring strength derived from overall credibility
  next.anchoringStrength = next.overallScore / 100

  return next
}

// ============================================================================
// MACRO SIMULATION (IS-LM-Phillips)
// ============================================================================

export type MacroSimulationInputs = {
  prevMacro: MacroState
  financial: FinancialConditions
  credibility: FedCredibility
  external: ExternalFactors
  fci: number
  action: PolicyAction | SimplePolicyAction | null
  random: () => number
}

/**
 * Simulate one turn of macroeconomic evolution
 * Based on IS-LM-Phillips framework with rational expectations
 */
export function simulateMacro(inputs: MacroSimulationInputs): MacroState {
  const { prevMacro, financial, credibility, external, fci, random } = inputs

  const next = { ...prevMacro }

  // ========== IS CURVE: OUTPUT GAP ==========
  // Output gap responds to financial conditions with a lag

  // Real interest rate
  const realRate = financial.fedFundsRate - prevMacro.inflationExpectations

  // IS curve: tighter conditions → lower output gap
  const isShock = fci * 0.3 // financial conditions effect
  const realRateEffect = -(realRate - NEUTRAL_RATE) * 0.4 // rate above neutral slows growth
  const fiscalEffect = external.fiscalImpulse * 0.2
  const globalEffect = external.globalGrowth * 0.15

  const outputGapChange =
    isShock + realRateEffect + fiscalEffect + globalEffect + (random() - 0.5) * 0.3

  next.outputGap = clamp(prevMacro.outputGap + outputGapChange, -8, 8)

  // ========== GDP GROWTH ==========
  next.gdpGrowth = POTENTIAL_GROWTH + next.outputGap * 0.6 + (random() - 0.5) * 0.2
  next.gdpGrowth = clamp(next.gdpGrowth, -10, 10)

  // ========== PHILLIPS CURVE: INFLATION ==========
  // Inflation = expectations + output gap effect + supply shocks

  // Expectation component (anchored to target based on credibility)
  const anchoredExpectation =
    credibility.anchoringStrength * INFLATION_TARGET +
    (1 - credibility.anchoringStrength) * prevMacro.coreInflation

  // Output gap effect (positive gap → inflation)
  const demandPull = next.outputGap * 0.3

  // Supply shocks
  const oilInflation = (external.oilPrice - 80) / 100 // baseline $80
  const supplyShock = external.supplyChainStress * 0.02

  // Core inflation (sticky)
  const coreInflationChange = (anchoredExpectation - prevMacro.coreInflation) * 0.3 + demandPull * 0.5
  next.coreInflation = clamp(prevMacro.coreInflation + coreInflationChange + (random() - 0.5) * 0.1, 0, 15)

  // Headline CPI (more volatile, includes food/energy)
  next.cpiInflation = next.coreInflation + oilInflation + supplyShock + (random() - 0.5) * 0.3
  next.cpiInflation = clamp(next.cpiInflation, -2, 20)

  // Update expectations (adaptive + anchored)
  next.inflationExpectations =
    credibility.anchoringStrength * INFLATION_TARGET +
    (1 - credibility.anchoringStrength) * (0.5 * prevMacro.coreInflation + 0.5 * next.coreInflation)

  // ========== OKUN'S LAW: UNEMPLOYMENT ==========
  // Each 1% below potential GDP → 0.5% higher unemployment

  const okunEffect = -next.outputGap * 0.4
  const laborFriction = 0.1 // natural labor market friction

  next.unemploymentRate = clamp(
    NAIRU + okunEffect + laborFriction + (random() - 0.5) * 0.2,
    2,
    15
  )

  // Labor force participation (pro-cyclical)
  next.laborForceParticipation = clamp(
    62.5 + next.outputGap * 0.3 + (random() - 0.5) * 0.1,
    58,
    68
  )

  // Wage growth (Phillips curve for wages)
  const wagePressure = (NAIRU - next.unemploymentRate) * 0.5 + next.coreInflation * 0.4
  next.wageGrowth = clamp(wagePressure + 1 + (random() - 0.5) * 0.3, -2, 10)

  // ========== OTHER INDICATORS ==========

  // Consumer confidence (responds to jobs, inflation, markets)
  const confidenceFromJobs = (NAIRU - next.unemploymentRate) * 5
  const confidenceFromInflation = (INFLATION_TARGET - next.coreInflation) * 3
  const confidenceFromMarkets = fci * 3

  next.consumerConfidence = clamp(
    prevMacro.consumerConfidence * 0.7 +
      (50 + confidenceFromJobs + confidenceFromInflation + confidenceFromMarkets) * 0.3,
    20,
    100
  )

  // Retail sales (consumer spending)
  next.retailSalesGrowth = next.gdpGrowth * 0.8 + fci * 0.5 + (random() - 0.5) * 0.5
  next.retailSalesGrowth = clamp(next.retailSalesGrowth, -10, 15)

  // Savings rate (inverse to confidence)
  next.personalSavingsRate = clamp(8 - (next.consumerConfidence - 50) * 0.1, 2, 20)

  // PMIs
  next.pmiManufacturing = clamp(
    50 + next.outputGap * 3 + external.globalGrowth * 2 + (random() - 0.5) * 2,
    30,
    70
  )
  next.pmiServices = clamp(50 + next.outputGap * 4 + (random() - 0.5) * 2, 30, 70)

  // Business investment
  next.businessInvestment = clamp(
    prevMacro.businessInvestment + fci * 0.2 - (realRate - NEUTRAL_RATE) * 0.3,
    10,
    25
  )

  // Housing (rate sensitive)
  const mortgageRate = financial.yield10y + financial.mortgageSpread
  const housingPressure = -(mortgageRate - 6) * 2 // baseline 6% mortgage
  next.housePriceIndex = clamp(
    prevMacro.housePriceIndex + housingPressure + next.wageGrowth * 0.5,
    100,
    400
  )
  next.housingSales = clamp(4 + housingPressure * 0.2, 2, 7) // millions annualized

  // Industrial production
  next.industrialProduction = clamp(
    100 + next.outputGap * 2 + external.globalGrowth + (random() - 0.5),
    80,
    120
  )

  // Corporate profits
  next.corporateProfitGrowth = next.gdpGrowth * 1.5 + fci * 0.5 + (random() - 0.5)
  next.corporateProfitGrowth = clamp(next.corporateProfitGrowth, -30, 30)

  // Job openings
  next.jobOpeningsRate = clamp(5 + (NAIRU - next.unemploymentRate) * 1.5, 2, 12)

  return next
}

// ============================================================================
// FINANCIAL MARKET UPDATE
// ============================================================================

export type FinancialSimulationInputs = {
  prevFinancial: FinancialConditions
  macro: MacroState
  credibility: FedCredibility
  balanceSheet: BalanceSheet
  action: PolicyAction | SimplePolicyAction | null
  random: () => number
}

/**
 * Update financial markets based on macro conditions and Fed action
 */
export function simulateFinancial(inputs: FinancialSimulationInputs): FinancialConditions {
  const { prevFinancial, macro, credibility, balanceSheet, action, random } = inputs

  const next = { ...prevFinancial }

  // Fed funds rate update
  if (action) {
    if (typeof action === 'string') {
      if (action === 'raise') next.fedFundsRate += 0.25
      if (action === 'cut') next.fedFundsRate -= 0.25
    } else if (action.type === 'rate') {
      const rateAction = action as RateAction
      const change = rateAction.magnitude / 100
      if (rateAction.direction === 'raise') next.fedFundsRate += change
      if (rateAction.direction === 'cut') next.fedFundsRate -= change
    }
  }
  next.fedFundsRate = clamp(next.fedFundsRate, 0, 20)

  // Discount rate follows fed funds
  next.discountRate = next.fedFundsRate + 0.5

  // Prime rate
  next.primeRate = next.fedFundsRate + 3

  // Yield curve
  const yields = calculateYieldCurve(
    next.fedFundsRate,
    macro.inflationExpectations,
    credibility,
    macro.gdpGrowth,
    balanceSheet,
    random
  )
  next.yield2y = yields.yield2y
  next.yield5y = yields.yield5y
  next.yield10y = yields.yield10y
  next.yield30y = yields.yield30y

  // Credit spread (widens during stress)
  const stressIndicator =
    (macro.unemploymentRate - NAIRU) * 0.2 + (INFLATION_TARGET - macro.coreInflation) * -0.1
  next.creditSpread = clamp(1.5 + stressIndicator + (random() - 0.5) * 0.2, 0.5, 8)

  // Mortgage spread
  next.mortgageSpread = clamp(1.7 + stressIndicator * 0.5 + (random() - 0.5) * 0.1, 1, 4)

  // TED spread (interbank stress)
  next.tedSpread = clamp(0.2 + stressIndicator * 0.3 + (random() - 0.5) * 0.1, 0, 3)

  // Equity markets
  const equityFundamentals = macro.corporateProfitGrowth * 0.5 + macro.gdpGrowth * 0.3
  const equityValuation = -(next.yield10y - 3) * 100 // higher rates = lower valuations
  const equitySentiment = (macro.consumerConfidence - 50) * 2

  const spxChange = equityFundamentals + equityValuation + equitySentiment + (random() - 0.5) * 50
  next.spxLevel = clamp(prevFinancial.spxLevel + spxChange, 2000, 8000)

  // VIX (inverse to confidence, rises during stress)
  next.spxVolatility = clamp(20 - macro.consumerConfidence * 0.1 + stressIndicator * 5, 10, 80)

  // Equity risk premium
  const earningsYield = 0.05 // simplified
  next.equityRiskPremium = earningsYield - next.yield10y / 100 + 0.05

  // Dollar index
  const rateDifferential = next.fedFundsRate - 2 // vs rest of world
  next.dollarIndex = clamp(100 + rateDifferential * 3 + (random() - 0.5) * 2, 80, 130)

  // Bitcoin (high vol, loosely correlated to liquidity)
  const btcChange =
    next.fci * 5000 + // loose conditions = higher BTC
    (random() - 0.5) * 3000
  next.btcPrice = clamp(prevFinancial.btcPrice + btcChange, 10000, 200000)

  // Update FCI
  next.fci = calculateFCI(next, balanceSheet, prevFinancial.fci)

  return next
}

// ============================================================================
// EXTERNAL FACTORS (evolve slowly, can be shocked by events)
// ============================================================================

export function evolveExternalFactors(
  prev: ExternalFactors,
  random: () => number
): ExternalFactors {
  const next = { ...prev }

  // Oil price mean-reverts to ~$80 with volatility
  next.oilPrice = clamp(prev.oilPrice + (80 - prev.oilPrice) * 0.1 + (random() - 0.5) * 10, 30, 200)

  // Global growth mean-reverts to ~2.5%
  next.globalGrowth = clamp(
    prev.globalGrowth + (2.5 - prev.globalGrowth) * 0.2 + (random() - 0.5) * 0.3,
    -5,
    8
  )

  // China growth
  next.chinaGrowth = clamp(
    prev.chinaGrowth + (5 - prev.chinaGrowth) * 0.15 + (random() - 0.5) * 0.5,
    -3,
    12
  )

  // Europe growth
  next.europeGrowth = clamp(
    prev.europeGrowth + (1.5 - prev.europeGrowth) * 0.2 + (random() - 0.5) * 0.3,
    -5,
    5
  )

  // Supply chain stress decays
  next.supplyChainStress = clamp(prev.supplyChainStress * 0.9 + (random() - 0.5) * 5, 0, 100)

  // Geopolitical risk is sticky
  next.geopoliticalRisk = clamp(
    prev.geopoliticalRisk * 0.95 + 20 * 0.05 + (random() - 0.5) * 5,
    0,
    100
  )

  // Fiscal impulse decays toward neutral
  next.fiscalImpulse = clamp(prev.fiscalImpulse * 0.9 + (random() - 0.5) * 0.2, -3, 3)

  // Commodity index follows oil loosely
  next.commodityIndex = clamp(100 + (next.oilPrice - 80) * 0.5 + (random() - 0.5) * 5, 60, 200)

  return next
}

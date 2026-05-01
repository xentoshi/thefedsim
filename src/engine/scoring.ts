// src/engine/scoring.ts
// Policy score calculation and performance metrics

import {
  GameState,
  PolicyScore,
  MacroState,
  FinancialConditions,
  FedCredibility,
  clamp,
} from './types'

// ============================================================================
// CONSTANTS
// ============================================================================

const INFLATION_TARGET = 2.0
const NAIRU = 4.5 // Natural rate of unemployment
// const POTENTIAL_GROWTH = 2.0 // Used for reference

// Weights for final score
const WEIGHTS = {
  priceStability: 0.30,
  employment: 0.25,
  financialStability: 0.20,
  credibility: 0.15,
  growth: 0.10,
}

// ============================================================================
// COMPONENT SCORES
// ============================================================================

/**
 * Price stability score (0-100)
 * Higher score = closer to 2% inflation target
 */
export function calculatePriceStabilityScore(history: Array<{ macro: MacroState }>): number {
  if (history.length === 0) return 50

  // Average core inflation over the game
  const avgInflation = history.reduce((sum, h) => sum + h.macro.coreInflation, 0) / history.length

  // Volatility penalty
  const inflationVol = Math.sqrt(
    history.reduce((sum, h) => sum + Math.pow(h.macro.coreInflation - avgInflation, 2), 0) / history.length
  )

  // Distance from target
  const deviation = Math.abs(avgInflation - INFLATION_TARGET)

  // Score: 100 at target, decays with deviation
  // -20 points per percentage point away from target
  // -10 points per point of volatility
  const score = 100 - deviation * 20 - inflationVol * 10

  return clamp(score, 0, 100)
}

/**
 * Employment score (0-100)
 * Higher score = lower unemployment, closer to NAIRU
 */
export function calculateEmploymentScore(history: Array<{ macro: MacroState }>): number {
  if (history.length === 0) return 50

  // Average unemployment
  const avgUnemployment = history.reduce((sum, h) => sum + h.macro.unemploymentRate, 0) / history.length

  // Peak unemployment (worst moment)
  const peakUnemployment = Math.max(...history.map(h => h.macro.unemploymentRate))

  // Time above 6% (significant distress)
  const turnsAbove6 = history.filter(h => h.macro.unemploymentRate > 6).length
  const distressPenalty = (turnsAbove6 / history.length) * 30

  // Distance from NAIRU
  const deviation = Math.abs(avgUnemployment - NAIRU)

  // Too low is also penalized (overheating)
  const overheatingPenalty = avgUnemployment < 3.5 ? (3.5 - avgUnemployment) * 5 : 0

  // Peak penalty (unemployment spikes are bad)
  const peakPenalty = peakUnemployment > 7 ? (peakUnemployment - 7) * 5 : 0

  const score = 100 - deviation * 8 - distressPenalty - overheatingPenalty - peakPenalty

  return clamp(score, 0, 100)
}

/**
 * Financial stability score (0-100)
 * Higher score = no crises, low market volatility
 */
export function calculateFinancialStabilityScore(
  history: Array<{ financial: FinancialConditions }>,
  hadCrisis: boolean
): number {
  if (history.length === 0) return 50

  // Average VIX
  const avgVix = history.reduce((sum, h) => sum + h.financial.spxVolatility, 0) / history.length

  // Peak VIX
  const peakVix = Math.max(...history.map(h => h.financial.spxVolatility))

  // Credit spread average
  const avgSpread = history.reduce((sum, h) => sum + h.financial.creditSpread, 0) / history.length

  // Time with inverted yield curve
  const turnsInverted = history.filter(h => h.financial.yield2y > h.financial.yield10y).length
  const inversionPenalty = (turnsInverted / history.length) * 15

  // Volatility penalty
  const vixPenalty = (avgVix - 15) * 2 + (peakVix > 40 ? (peakVix - 40) : 0)

  // Credit spread penalty
  const spreadPenalty = (avgSpread - 1.5) * 10

  // Crisis is a major hit
  const crisisPenalty = hadCrisis ? 25 : 0

  const score = 100 - vixPenalty - spreadPenalty - inversionPenalty - crisisPenalty

  return clamp(score, 0, 100)
}

/**
 * Credibility score (0-100)
 * Based on final credibility and trajectory
 */
export function calculateCredibilityScore(
  history: Array<{ credibility: FedCredibility }>,
  finalCredibility: FedCredibility
): number {
  if (history.length === 0) return finalCredibility.overallScore

  // Starting vs ending credibility
  const startingCred = history[0].credibility.overallScore
  const endingCred = finalCredibility.overallScore

  // Trajectory bonus/penalty
  const trajectoryBonus = (endingCred - startingCred) * 0.5

  // Average credibility
  const avgCred = history.reduce((sum, h) => sum + h.credibility.overallScore, 0) / history.length

  // Time below 50 (credibility crisis)
  const turnsLowCred = history.filter(h => h.credibility.overallScore < 50).length
  const lowCredPenalty = (turnsLowCred / history.length) * 20

  const score = avgCred * 0.6 + endingCred * 0.4 + trajectoryBonus - lowCredPenalty

  return clamp(score, 0, 100)
}

/**
 * Growth score (0-100)
 * Higher score = sustained positive growth
 */
export function calculateGrowthScore(history: Array<{ macro: MacroState }>): number {
  if (history.length === 0) return 50

  // Average GDP growth
  const avgGrowth = history.reduce((sum, h) => sum + h.macro.gdpGrowth, 0) / history.length

  // Quarters of negative growth (recession)
  const recessionQuarters = history.filter(h => h.macro.gdpGrowth < 0).length
  const recessionPenalty = recessionQuarters * 5

  // Deep recession penalty
  const deepestContraction = Math.min(...history.map(h => h.macro.gdpGrowth))
  const deepRecessionPenalty = deepestContraction < -2 ? (-deepestContraction - 2) * 10 : 0

  // Above potential is slightly penalized (overheating)
  const overheatingPenalty = avgGrowth > 4 ? (avgGrowth - 4) * 3 : 0

  // Base score from average growth
  // 2% growth = 80 points, 0% = 50, -2% = 20
  const baseScore = 50 + avgGrowth * 15

  const score = baseScore - recessionPenalty - deepRecessionPenalty - overheatingPenalty

  return clamp(score, 0, 100)
}

// ============================================================================
// BONUSES AND PENALTIES
// ============================================================================

/**
 * Soft landing bonus: reduced rates without triggering recession
 */
export function calculateSoftLandingBonus(state: GameState): number {
  // Check if rates were cut significantly
  const rateHistory = state.history.map(h => h.financial.fedFundsRate)
  if (rateHistory.length < 5) return 0

  const peakRate = Math.max(...rateHistory)
  const finalRate = state.financial.fedFundsRate
  const rateCut = peakRate - finalRate

  // Need to have cut at least 100bps
  if (rateCut < 1.0) return 0

  // Check for recession during cutting cycle
  const hadRecession = state.history.some(h => h.macro.gdpGrowth < -0.5)

  if (hadRecession) return 0

  // Soft landing achieved! Bonus based on size of rate cut
  return Math.min(rateCut * 5, 15) // max 15 points
}

/**
 * Crisis management bonus: survived a crisis without catastrophic damage
 */
export function calculateCrisisBonus(state: GameState): number {
  const hadCrisis = state.eventHistory.some(e => e.severity === 'crisis')

  if (!hadCrisis) return 0

  // Check outcomes during/after crisis
  const finalState = state.history[state.history.length - 1]
  if (!finalState) return 0

  // Good outcomes after crisis
  const goodInflation = finalState.macro.coreInflation < 4
  const goodUnemployment = finalState.macro.unemploymentRate < 7
  const goodCredibility = finalState.credibility.overallScore > 60

  let bonus = 0
  if (goodInflation) bonus += 5
  if (goodUnemployment) bonus += 5
  if (goodCredibility) bonus += 5

  return bonus
}

/**
 * Recession penalty: if a recession occurred
 */
export function calculateRecessionPenalty(state: GameState): number {
  // Two consecutive quarters of negative growth = recession
  let consecutiveNegative = 0
  let hadRecession = false

  for (const h of state.history) {
    if (h.macro.gdpGrowth < 0) {
      consecutiveNegative++
      if (consecutiveNegative >= 2) {
        hadRecession = true
        break
      }
    } else {
      consecutiveNegative = 0
    }
  }

  if (!hadRecession) return 0

  // Penalty based on severity
  const worstGrowth = Math.min(...state.history.map(h => h.macro.gdpGrowth))
  const peakUnemployment = Math.max(...state.history.map(h => h.macro.unemploymentRate))

  let penalty = 10 // base recession penalty

  // Deeper recessions penalized more
  if (worstGrowth < -2) penalty += (-worstGrowth - 2) * 5
  if (peakUnemployment > 7) penalty += (peakUnemployment - 7) * 3

  return Math.min(penalty, 30)
}

/**
 * Inflation spike penalty: if inflation went very high
 */
export function calculateInflationSpikePenalty(state: GameState): number {
  const peakInflation = Math.max(...state.history.map(h => h.macro.coreInflation))

  if (peakInflation < 5) return 0

  // Penalty scales with how high inflation got
  return Math.min((peakInflation - 5) * 5, 25)
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

/**
 * Calculate complete policy score
 */
export function calculatePolicyScore(state: GameState): PolicyScore {
  const hadCrisis = state.eventHistory.some(e => e.severity === 'crisis' || e.severity === 'major')

  // Component scores
  const priceStability = calculatePriceStabilityScore(state.history)
  const employment = calculateEmploymentScore(state.history)
  const financialStability = calculateFinancialStabilityScore(state.history, hadCrisis)
  const credibility = calculateCredibilityScore(state.history, state.credibility)
  const growth = calculateGrowthScore(state.history)

  // Bonuses and penalties
  const softLandingBonus = calculateSoftLandingBonus(state)
  const crisisBonus = calculateCrisisBonus(state)
  const recessionPenalty = calculateRecessionPenalty(state)
  const inflationSpikePenalty = calculateInflationSpikePenalty(state)

  // Weighted overall score
  const baseScore =
    priceStability * WEIGHTS.priceStability +
    employment * WEIGHTS.employment +
    financialStability * WEIGHTS.financialStability +
    credibility * WEIGHTS.credibility +
    growth * WEIGHTS.growth

  const overall = clamp(
    baseScore + softLandingBonus + crisisBonus - recessionPenalty - inflationSpikePenalty,
    0,
    100
  )

  return {
    overall,
    priceStability,
    employment,
    financialStability,
    credibility,
    growth,
    softLandingBonus,
    crisisBonus,
    recessionPenalty,
    inflationSpikePenalty,
    percentile: 0, // Calculated server-side against other players
  }
}

// ============================================================================
// GRADE CONVERSION
// ============================================================================

export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F'

export function scoreToGrade(score: number): Grade {
  if (score >= 97) return 'A+'
  if (score >= 93) return 'A'
  if (score >= 90) return 'A-'
  if (score >= 87) return 'B+'
  if (score >= 83) return 'B'
  if (score >= 80) return 'B-'
  if (score >= 77) return 'C+'
  if (score >= 73) return 'C'
  if (score >= 70) return 'C-'
  if (score >= 60) return 'D'
  return 'F'
}

export function gradeToColor(grade: Grade): string {
  if (grade.startsWith('A')) return '#22c55e' // green
  if (grade.startsWith('B')) return '#3b82f6' // blue
  if (grade.startsWith('C')) return '#eab308' // yellow
  if (grade === 'D') return '#f97316' // orange
  return '#ef4444' // red
}

// ============================================================================
// HISTORICAL CHAIR COMPARISON
// ============================================================================

export type FedChairComparison = {
  name: string
  tenure: string
  avgInflation: number
  avgUnemployment: number
  avgGrowth: number
  crises: string[]
  score: number // estimated
}

export const HISTORICAL_CHAIRS: FedChairComparison[] = [
  {
    name: 'Paul Volcker',
    tenure: '1979-1987',
    avgInflation: 6.5,
    avgUnemployment: 7.5,
    avgGrowth: 2.5,
    crises: ['Volcker Recession'],
    score: 72, // Tamed inflation but at high cost
  },
  {
    name: 'Alan Greenspan',
    tenure: '1987-2006',
    avgInflation: 3.0,
    avgUnemployment: 5.5,
    avgGrowth: 3.2,
    crises: ['1987 Crash', 'LTCM', 'Dot-com', 'Housing Bubble'],
    score: 68, // Good growth but seeded crises
  },
  {
    name: 'Ben Bernanke',
    tenure: '2006-2014',
    avgInflation: 2.0,
    avgUnemployment: 7.0,
    avgGrowth: 1.3,
    crises: ['2008 GFC'],
    score: 65, // Crisis management but slow recovery
  },
  {
    name: 'Janet Yellen',
    tenure: '2014-2018',
    avgInflation: 1.5,
    avgUnemployment: 4.8,
    avgGrowth: 2.3,
    crises: [],
    score: 78, // Quiet period, normalization
  },
  {
    name: 'Jerome Powell',
    tenure: '2018-present',
    avgInflation: 3.5,
    avgUnemployment: 4.5,
    avgGrowth: 2.0,
    crises: ['COVID Recession', 'Inflation Surge'],
    score: 70, // Crisis response good, inflation late
  },
]

export function compareToChairs(playerScore: number): FedChairComparison | null {
  // Find the closest historical chair
  let closest: FedChairComparison | null = null
  let minDiff = Infinity

  for (const chair of HISTORICAL_CHAIRS) {
    const diff = Math.abs(chair.score - playerScore)
    if (diff < minDiff) {
      minDiff = diff
      closest = chair
    }
  }

  return closest
}

// src/engine/scenarios.ts
// Campaign scenarios and sandbox presets

import { Scenario, GameState, MacroState, FinancialConditions, BalanceSheet, FedCredibility, ExternalFactors } from './types'

// ============================================================================
// DEFAULT STARTING VALUES
// ============================================================================

export const DEFAULT_MACRO: MacroState = {
  cpiInflation: 2.5,
  coreInflation: 2.3,
  inflationExpectations: 2.2,
  unemploymentRate: 4.0,
  laborForceParticipation: 62.5,
  wageGrowth: 3.5,
  jobOpeningsRate: 5.5,
  gdpGrowth: 2.2,
  outputGap: 0.5,
  industrialProduction: 102,
  housePriceIndex: 280,
  housingSales: 4.5,
  consumerConfidence: 68,
  retailSalesGrowth: 3.0,
  personalSavingsRate: 5.0,
  businessInvestment: 17,
  corporateProfitGrowth: 5.0,
  pmiManufacturing: 52,
  pmiServices: 54,
}

export const DEFAULT_FINANCIAL: FinancialConditions = {
  fedFundsRate: 5.25,
  discountRate: 5.75,
  primeRate: 8.25,
  yield2y: 4.8,
  yield5y: 4.4,
  yield10y: 4.2,
  yield30y: 4.3,
  creditSpread: 1.6,
  mortgageSpread: 1.8,
  tedSpread: 0.25,
  spxLevel: 4500,
  spxVolatility: 18,
  equityRiskPremium: 0.045,
  dollarIndex: 103,
  btcPrice: 45000,
  fci: 0.2,
}

export const DEFAULT_BALANCE_SHEET: BalanceSheet = {
  treasuries: 5000,
  mbs: 2500,
  repoLoans: 0,
  otherAssets: 200,
  reserves: 3200,
  reverseRepos: 1800,
  currency: 2300,
  treasuryDeposits: 500,
  totalAssets: 7700,
  netInterestMargin: 0.02,
}

export const DEFAULT_CREDIBILITY: FedCredibility = {
  overallScore: 75,
  inflationFighting: 72,
  forwardGuidanceAccuracy: 78,
  crisisResponse: 80,
  independencePerception: 70,
  marketRatePath: [5.25, 5.0, 4.75, 4.5, 4.25, 4.0, 3.75, 3.5],
  fedDotMedian: [5.0, 4.5, 4.0, 3.75, 3.5, 3.25, 3.0, 3.0],
  anchoringStrength: 0.75,
}

export const DEFAULT_EXTERNAL: ExternalFactors = {
  oilPrice: 78,
  commodityIndex: 105,
  globalGrowth: 2.8,
  chinaGrowth: 5.2,
  europeGrowth: 1.2,
  fiscalImpulse: 0.3,
  supplyChainStress: 15,
  geopoliticalRisk: 25,
}

// ============================================================================
// CAMPAIGN SCENARIOS
// ============================================================================

export const SCENARIOS: Record<string, Scenario> = {
  // ========== TUTORIAL ==========
  tutorial: {
    id: 'tutorial',
    name: 'Fed Chair 101',
    description: 'Learn the basics of monetary policy in a stable environment.',
    briefing: `
      Welcome to the Federal Reserve, Chair. The economy is in good shape,
      but your predecessor left you with a slightly elevated inflation rate.

      Your task: bring inflation down to 2% while maintaining full employment.
      Use rate hikes carefully - too fast and you'll trigger a recession.

      This scenario will introduce you to the core policy tools.
    `,
    year: 2024,
    duration: 12,
    initialState: {
      macro: {
        ...DEFAULT_MACRO,
        coreInflation: 3.2,
        cpiInflation: 3.5,
      },
      financial: {
        ...DEFAULT_FINANCIAL,
        fedFundsRate: 4.5,
      },
      credibility: {
        ...DEFAULT_CREDIBILITY,
        overallScore: 80,
      },
    },
    objectives: [
      {
        description: 'Bring core inflation below 2.5%',
        condition: (state) => state.macro.coreInflation < 2.5,
        weight: 0.4,
      },
      {
        description: 'Keep unemployment below 5%',
        condition: (state) => state.macro.unemploymentRate < 5,
        weight: 0.3,
      },
      {
        description: 'Maintain credibility above 70',
        condition: (state) => state.credibility.overallScore > 70,
        weight: 0.3,
      },
    ],
    failureConditions: [
      {
        description: 'Unemployment exceeds 8%',
        condition: (state) => state.macro.unemploymentRate > 8,
      },
      {
        description: 'Credibility falls below 40',
        condition: (state) => state.credibility.overallScore < 40,
      },
    ],
    scriptedEvents: [],
  },

  // ========== 1970s STAGFLATION ==========
  stagflation_1979: {
    id: 'stagflation_1979',
    name: 'Volcker\'s Challenge',
    description: 'Take on the role of Paul Volcker in 1979. Inflation is raging, and drastic action is needed.',
    briefing: `
      August 1979. Inflation has been rising for a decade and now exceeds 11%.
      The previous Fed chairs tried gradualism. It failed.

      President Carter has appointed you to restore price stability - whatever it takes.

      Warning: The economy is already weakening. Aggressive rate hikes will cause
      a severe recession. But if you don't act, inflation will spiral out of control.

      History will judge you. Will you have the resolve?
    `,
    year: 1979,
    duration: 24,
    initialState: {
      macro: {
        ...DEFAULT_MACRO,
        cpiInflation: 11.3,
        coreInflation: 9.5,
        inflationExpectations: 8.5,
        unemploymentRate: 5.8,
        gdpGrowth: 0.5,
        outputGap: -1.0,
        consumerConfidence: 45,
        wageGrowth: 8.5,
      },
      financial: {
        ...DEFAULT_FINANCIAL,
        fedFundsRate: 10.5,
        yield2y: 9.8,
        yield10y: 9.2,
        yield30y: 9.5,
        spxLevel: 850,
        spxVolatility: 25,
        fci: -0.5,
      },
      credibility: {
        ...DEFAULT_CREDIBILITY,
        overallScore: 35,
        inflationFighting: 25,
        anchoringStrength: 0.35,
      },
      external: {
        ...DEFAULT_EXTERNAL,
        oilPrice: 35, // Second oil shock
      },
    },
    objectives: [
      {
        description: 'Bring inflation below 5%',
        condition: (state) => state.macro.coreInflation < 5,
        weight: 0.5,
      },
      {
        description: 'Restore credibility above 70',
        condition: (state) => state.credibility.overallScore > 70,
        weight: 0.3,
      },
      {
        description: 'Avoid unemployment exceeding 12%',
        condition: (state) => state.macro.unemploymentRate < 12,
        weight: 0.2,
      },
    ],
    failureConditions: [
      {
        description: 'Inflation exceeds 15%',
        condition: (state) => state.macro.coreInflation > 15,
      },
      {
        description: 'Credibility falls below 20',
        condition: (state) => state.credibility.overallScore < 20,
      },
    ],
    scriptedEvents: [
      { turn: 4, eventId: 'oil_shock' },
      { turn: 10, eventId: 'fed_independence_threat' },
    ],
    unlocksTools: ['forward_guidance'],
  },

  // ========== 2008 FINANCIAL CRISIS ==========
  gfc_2008: {
    id: 'gfc_2008',
    name: 'The Great Financial Crisis',
    description: 'September 2008. Lehman has just collapsed. The financial system is on the brink.',
    briefing: `
      September 15, 2008. Lehman Brothers filed for bankruptcy this morning.
      The financial system is freezing. Banks won't lend to each other.
      Credit markets are seizing up. AIG is about to fail.

      Conventional monetary policy has limits - rates are already at 2%.
      You'll need to deploy unconventional tools: emergency lending facilities,
      quantitative easing, and creative interventions.

      The fate of the global economy is in your hands.
    `,
    year: 2008,
    duration: 20,
    initialState: {
      macro: {
        ...DEFAULT_MACRO,
        cpiInflation: 4.9,
        coreInflation: 2.4,
        unemploymentRate: 6.1,
        gdpGrowth: -0.3,
        outputGap: -2.5,
        consumerConfidence: 38,
        housePriceIndex: 190,
        housingSales: 2.5,
      },
      financial: {
        ...DEFAULT_FINANCIAL,
        fedFundsRate: 2.0,
        yield2y: 2.3,
        yield10y: 3.7,
        creditSpread: 5.5,
        tedSpread: 3.0,
        spxLevel: 1250,
        spxVolatility: 45,
        fci: -3.0,
      },
      balanceSheet: {
        ...DEFAULT_BALANCE_SHEET,
        treasuries: 480,
        mbs: 0,
        totalAssets: 900,
      },
      credibility: {
        ...DEFAULT_CREDIBILITY,
        overallScore: 70,
        crisisResponse: 65,
      },
    },
    objectives: [
      {
        description: 'Prevent financial system collapse',
        condition: (state) => state.financial.creditSpread < 8,
        weight: 0.4,
      },
      {
        description: 'Limit peak unemployment to 10%',
        condition: (state) => state.macro.unemploymentRate < 10,
        weight: 0.3,
      },
      {
        description: 'Restore credit markets (spreads below 3%)',
        condition: (state) => state.financial.creditSpread < 3,
        weight: 0.3,
      },
    ],
    failureConditions: [
      {
        description: 'Credit spreads exceed 10% (systemic failure)',
        condition: (state) => state.financial.creditSpread > 10,
      },
      {
        description: 'Unemployment exceeds 15%',
        condition: (state) => state.macro.unemploymentRate > 15,
      },
    ],
    scriptedEvents: [
      { turn: 1, eventId: 'banking_stress' },
      { turn: 3, eventId: 'credit_crunch' },
      { turn: 6, eventId: 'housing_bubble_pop' },
    ],
    requiresCompletion: ['tutorial'],
    unlocksTools: ['qe', 'facilities'],
  },

  // ========== 2020 COVID CRISIS ==========
  covid_2020: {
    id: 'covid_2020',
    name: 'Pandemic Response',
    description: 'March 2020. COVID-19 is spreading globally. Markets are crashing. Act fast.',
    briefing: `
      March 2020. A novel coronavirus is sweeping the globe.
      Cities are locking down. The economy is about to experience
      the sharpest contraction since the Great Depression.

      Unlike 2008, this isn't a financial crisis - it's a public health crisis.
      But the Fed must still act to prevent financial contagion.

      You have more tools than Bernanke did - use them.
      But be warned: the fiscal response will be massive,
      and inflation may become a problem down the road.
    `,
    year: 2020,
    duration: 16,
    initialState: {
      macro: {
        ...DEFAULT_MACRO,
        cpiInflation: 2.3,
        coreInflation: 2.1,
        unemploymentRate: 3.5,
        gdpGrowth: 2.1,
        outputGap: 0.5,
        consumerConfidence: 130,
      },
      financial: {
        ...DEFAULT_FINANCIAL,
        fedFundsRate: 1.75,
        spxLevel: 3380,
        spxVolatility: 15,
        fci: 0.5,
      },
      balanceSheet: {
        ...DEFAULT_BALANCE_SHEET,
        totalAssets: 4200,
      },
      credibility: {
        ...DEFAULT_CREDIBILITY,
        overallScore: 78,
      },
    },
    objectives: [
      {
        description: 'Limit peak unemployment to 15%',
        condition: (state) => Math.max(...state.history.map(h => h.macro.unemploymentRate)) < 15,
        weight: 0.3,
      },
      {
        description: 'Prevent financial market seizure',
        condition: (state) => state.financial.creditSpread < 4,
        weight: 0.3,
      },
      {
        description: 'Keep inflation under control (below 7%)',
        condition: (state) => state.macro.coreInflation < 7,
        weight: 0.4,
      },
    ],
    failureConditions: [
      {
        description: 'GDP contracts more than 15%',
        condition: (state) => state.macro.gdpGrowth < -15,
      },
      {
        description: 'Inflation exceeds 10%',
        condition: (state) => state.macro.coreInflation > 10,
      },
    ],
    scriptedEvents: [
      { turn: 1, eventId: 'pandemic' },
      { turn: 2, eventId: 'flash_crash' },
      { turn: 8, eventId: 'supply_chain_crisis' },
    ],
    requiresCompletion: ['tutorial'],
    unlocksTools: ['all_facilities'],
  },

  // ========== FUTURE HYPOTHETICAL: AI REVOLUTION ==========
  ai_disruption_2027: {
    id: 'ai_disruption_2027',
    name: 'The AI Revolution',
    description: 'A hypothetical future where AI transforms the economy. Navigate uncharted waters.',
    briefing: `
      2027. Artificial general intelligence is here.

      Productivity is soaring as AI automates white-collar work.
      But disruption is massive - entire industries are transforming overnight.

      Is this a productivity boom that will lower inflation?
      Or a deflationary bust as workers are displaced?
      Traditional models may not apply.

      You're the first Fed chair to navigate this transition.
      Write the playbook.
    `,
    year: 2027,
    duration: 20,
    initialState: {
      macro: {
        ...DEFAULT_MACRO,
        gdpGrowth: 4.5,
        unemploymentRate: 5.5, // Tech unemployment rising
        coreInflation: 1.2, // Deflationary pressure
        wageGrowth: 1.5, // Wage pressure for non-AI jobs
        pmiManufacturing: 62,
        pmiServices: 58,
      },
      financial: {
        ...DEFAULT_FINANCIAL,
        spxLevel: 7500,
        btcPrice: 150000,
        equityRiskPremium: 0.03, // Stretched valuations
      },
    },
    objectives: [
      {
        description: 'Maintain price stability (inflation 1-3%)',
        condition: (state) => state.macro.coreInflation >= 1 && state.macro.coreInflation <= 3,
        weight: 0.35,
      },
      {
        description: 'Manage labor market transition (unemployment below 7%)',
        condition: (state) => state.macro.unemploymentRate < 7,
        weight: 0.35,
      },
      {
        description: 'Prevent asset bubble crash',
        condition: (state) => state.financial.spxVolatility < 35,
        weight: 0.3,
      },
    ],
    failureConditions: [
      {
        description: 'Deflation takes hold (inflation below -1%)',
        condition: (state) => state.macro.coreInflation < -1,
      },
      {
        description: 'Tech bubble bursts (SPX drops 40%)',
        condition: (state) => state.financial.spxLevel < 4500,
      },
    ],
    scriptedEvents: [
      { turn: 3, eventId: 'ai_productivity_boom' },
      { turn: 8, eventId: 'demographic_shift' },
      { turn: 12, eventId: 'tech_bubble_burst' },
    ],
    requiresCompletion: ['gfc_2008', 'covid_2020'],
  },

  // ========== SANDBOX ==========
  sandbox: {
    id: 'sandbox',
    name: 'Sandbox Mode',
    description: 'Free play with default conditions. Set your own goals.',
    briefing: `The economy is stable — for now. Inflation is near the 2% target, unemployment is healthy, and growth is steady.

Your committee is watching. Crises will hit without warning: oil shocks, banking stress, political pressure. Your job is to keep the economy balanced through all of it.

Follow the committee recommendation or override it — every choice is yours. The score reflects how well you protected the dual mandate: stable prices and maximum employment.`,
    year: 2024,
    duration: 30,
    initialState: {},
    objectives: [],
    failureConditions: [
      {
        description: 'Economic collapse (GDP < -10%)',
        condition: (state) => state.macro.gdpGrowth < -10,
      },
      {
        description: 'Hyperinflation (inflation > 20%)',
        condition: (state) => state.macro.coreInflation > 20,
      },
    ],
    scriptedEvents: [],
  },
}

// ============================================================================
// SCENARIO UTILITIES
// ============================================================================

/**
 * Get list of available scenarios for a player
 */
export function getAvailableScenarios(completedScenarios: string[]): Scenario[] {
  return Object.values(SCENARIOS).filter(scenario => {
    // Sandbox always available
    if (scenario.id === 'sandbox') return true

    // Tutorial always available
    if (scenario.id === 'tutorial') return true

    // Check prerequisites
    if (scenario.requiresCompletion) {
      return scenario.requiresCompletion.every(req => completedScenarios.includes(req))
    }

    return true
  })
}

/**
 * Get scenario by ID
 */
export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS[id]
}

/**
 * Apply scenario initial state to game state
 */
export function applyScenarioInitialState(scenario: Scenario): Partial<GameState> {
  return {
    scenario,
    mode: scenario.id === 'sandbox' ? 'sandbox' : 'campaign',
    maxTurns: scenario.duration,
    turn: 0,
    macro: { ...DEFAULT_MACRO, ...scenario.initialState?.macro },
    financial: { ...DEFAULT_FINANCIAL, ...scenario.initialState?.financial },
    balanceSheet: { ...DEFAULT_BALANCE_SHEET, ...scenario.initialState?.balanceSheet },
    credibility: { ...DEFAULT_CREDIBILITY, ...scenario.initialState?.credibility },
    external: { ...DEFAULT_EXTERNAL, ...scenario.initialState?.external },
  }
}

// ============================================================================
// CHALLENGE MODE PRESETS
// ============================================================================

export type ChallengePreset = {
  id: string
  name: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  initialState: Partial<GameState>
  seed: number
}

/**
 * Generate a weekly challenge (seeded for consistency)
 */
export function generateWeeklyChallenge(weekNumber: number): ChallengePreset {
  // Use week number as seed for consistent challenges
  const seed = weekNumber * 12345

  const difficulties = ['easy', 'medium', 'hard', 'extreme'] as const
  const difficulty = difficulties[weekNumber % 4]

  const inflationVariant = 2 + (seed % 6) // 2-7
  const unemploymentVariant = 3 + (seed % 4) // 3-6
  const rateVariant = 3 + (seed % 5) // 3-7

  return {
    id: `weekly_${weekNumber}`,
    name: `Week ${weekNumber} Challenge`,
    description: `This week's challenge: Navigate a ${difficulty} economic scenario.`,
    difficulty,
    initialState: {
      macro: {
        ...DEFAULT_MACRO,
        coreInflation: inflationVariant,
        unemploymentRate: unemploymentVariant,
      },
      financial: {
        ...DEFAULT_FINANCIAL,
        fedFundsRate: rateVariant,
      },
    },
    seed,
  }
}

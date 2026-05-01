// src/engine/fomc.ts
// FOMC committee simulation with personality-driven voting

import {
  FomcMember,
  FomcMeeting,
  FomcVote,
  GameState,
  PolicyAction,
  SimplePolicyAction,
  clamp,
} from './types'

// ============================================================================
// FOMC MEMBERS
// ============================================================================

export const DEFAULT_COMMITTEE: FomcMember[] = [
  // Board of Governors (always vote)
  {
    id: 'powell',
    name: 'Jerome Powell',
    title: 'Chair',
    bias: 'centrist',
    weight: 1.5, // Chair carries extra weight
    dissenter: false,
    rateProjection: {},
  },
  {
    id: 'jefferson',
    name: 'Philip Jefferson',
    title: 'Vice Chair',
    bias: 'centrist',
    weight: 1.2,
    dissenter: false,
    rateProjection: {},
  },
  {
    id: 'waller',
    name: 'Christopher Waller',
    title: 'Governor',
    bias: 'hawk',
    weight: 1.0,
    dissenter: true, // Known to dissent
    rateProjection: {},
  },
  {
    id: 'cook',
    name: 'Lisa Cook',
    title: 'Governor',
    bias: 'dove',
    weight: 1.0,
    dissenter: false,
    rateProjection: {},
  },
  {
    id: 'bowman',
    name: 'Michelle Bowman',
    title: 'Governor',
    bias: 'hawk',
    weight: 1.0,
    dissenter: true,
    rateProjection: {},
  },
  {
    id: 'kugler',
    name: 'Adriana Kugler',
    title: 'Governor',
    bias: 'dove',
    weight: 1.0,
    dissenter: false,
    rateProjection: {},
  },
  {
    id: 'barr',
    name: 'Michael Barr',
    title: 'Vice Chair for Supervision',
    bias: 'centrist',
    weight: 1.0,
    dissenter: false,
    rateProjection: {},
  },

  // Regional Fed Presidents (rotating voters - simplified to always present)
  {
    id: 'williams',
    name: 'John Williams',
    title: 'NY Fed President',
    bias: 'centrist',
    weight: 1.1, // NY always votes and is influential
    dissenter: false,
    rateProjection: {},
  },
  {
    id: 'bostic',
    name: 'Raphael Bostic',
    title: 'Atlanta Fed President',
    bias: 'dove',
    weight: 1.0,
    dissenter: false,
    rateProjection: {},
  },
  {
    id: 'mester',
    name: 'Loretta Mester',
    title: 'Cleveland Fed President',
    bias: 'hawk',
    weight: 1.0,
    dissenter: true,
    rateProjection: {},
  },
  {
    id: 'daly',
    name: 'Mary Daly',
    title: 'SF Fed President',
    bias: 'dove',
    weight: 1.0,
    dissenter: false,
    rateProjection: {},
  },
  {
    id: 'kashkari',
    name: 'Neel Kashkari',
    title: 'Minneapolis Fed President',
    bias: 'hawk',
    weight: 1.0,
    dissenter: true, // Known contrarian
    rateProjection: {},
  },
]

// ============================================================================
// VOTING LOGIC
// ============================================================================

/**
 * Calculate Taylor Rule suggestion
 * r = r* + 0.5(π - π*) + 0.5(y - y*)
 */
function taylorRule(state: GameState): number {
  const neutralRate = 2.5
  const inflationGap = state.macro.coreInflation - 2.0
  const outputGap = state.macro.outputGap

  return neutralRate + 1.5 * inflationGap + 0.5 * outputGap
}

/**
 * Get individual member's preferred vote based on bias and conditions
 */
export function getMemberVote(member: FomcMember, state: GameState): FomcVote {
  const taylorSuggestion = taylorRule(state)
  const currentRate = state.financial.fedFundsRate
  const rateDiff = taylorSuggestion - currentRate

  // Base vote from Taylor Rule
  let baseVote: FomcVote = 'hold'
  if (rateDiff > 0.25) baseVote = 'raise'
  if (rateDiff < -0.25) baseVote = 'cut'

  // Apply bias adjustments
  switch (member.bias) {
    case 'hawk':
      // Hawks are more worried about inflation
      if (state.macro.coreInflation > 2.5 && baseVote === 'hold') {
        baseVote = 'raise'
      }
      if (state.macro.coreInflation > 3.5) {
        baseVote = 'raise'
      }
      // Hawks reluctant to cut unless necessary
      if (baseVote === 'cut' && state.macro.coreInflation > 2.2) {
        baseVote = 'hold'
      }
      // Hawks prefer QT over QE
      if (state.macro.coreInflation > 3 && state.balanceSheet.totalAssets > 6000) {
        return 'qt'
      }
      break

    case 'dove':
      // Doves are more worried about employment
      if (state.macro.unemploymentRate > 4.5 && baseVote === 'hold') {
        baseVote = 'cut'
      }
      if (state.macro.unemploymentRate > 5.5) {
        baseVote = 'cut'
      }
      // Doves reluctant to raise unless necessary
      if (baseVote === 'raise' && state.macro.unemploymentRate > 4.0) {
        baseVote = 'hold'
      }
      // Doves prefer QE when growth is weak
      if (state.macro.gdpGrowth < 1 && state.financial.fci < 0) {
        return 'qe'
      }
      break

    case 'centrist':
      // Centrists follow the data more closely
      // They weight both mandates equally
      const inflationDeviation = Math.abs(state.macro.coreInflation - 2.0)
      const unemploymentDeviation = Math.abs(state.macro.unemploymentRate - 4.5)

      if (inflationDeviation > unemploymentDeviation) {
        // Focus on inflation
        if (state.macro.coreInflation > 2.0 && rateDiff > 0) baseVote = 'raise'
        if (state.macro.coreInflation < 2.0 && rateDiff < 0) baseVote = 'cut'
      } else {
        // Focus on employment
        if (state.macro.unemploymentRate > 4.5 && rateDiff < 0) baseVote = 'cut'
        if (state.macro.unemploymentRate < 4.0 && rateDiff > 0) baseVote = 'raise'
      }
      break
  }

  // Dissenters may deviate from expected pattern
  if (member.dissenter) {
    // 20% chance to vote opposite to bias (shows independence)
    // This is simplified - in practice would use proper RNG
    const contrarian = Math.sin(state.turn * member.id.charCodeAt(0)) > 0.8
    if (contrarian) {
      if (baseVote === 'raise') return 'hold'
      if (baseVote === 'cut') return 'hold'
      if (baseVote === 'hold' && member.bias === 'hawk') return 'raise'
      if (baseVote === 'hold' && member.bias === 'dove') return 'cut'
    }
  }

  return baseVote
}

/**
 * Calculate rate projections for dot plot
 */
export function getMemberProjections(
  member: FomcMember,
  state: GameState
): { [year: string]: number } {
  const currentRate = state.financial.fedFundsRate
  const taylorTarget = taylorRule(state)
  const neutralRate = 2.5

  let endYear1: number
  let endYear2: number
  let longRun: number

  switch (member.bias) {
    case 'hawk':
      endYear1 = currentRate + (taylorTarget > currentRate ? 0.75 : 0.25)
      endYear2 = endYear1 + 0.25
      longRun = neutralRate + 0.5
      break
    case 'dove':
      endYear1 = currentRate + (taylorTarget < currentRate ? -0.75 : -0.25)
      endYear2 = endYear1 - 0.25
      longRun = neutralRate - 0.25
      break
    case 'centrist':
    default:
      endYear1 = currentRate + (taylorTarget - currentRate) * 0.5
      endYear2 = taylorTarget
      longRun = neutralRate
  }

  return {
    '2024': clamp(endYear1, 0, 10),
    '2025': clamp(endYear2, 0, 10),
    '2026': clamp((endYear2 + longRun) / 2, 0, 10),
    'Long Run': clamp(longRun, 0, 10),
  }
}

// ============================================================================
// FOMC MEETING
// ============================================================================

/**
 * Simulate an FOMC meeting
 */
export function simulateFomcMeeting(
  state: GameState,
  committee: FomcMember[],
  playerOverride?: SimplePolicyAction | PolicyAction
): FomcMeeting {
  // Collect votes
  const votes = new Map<string, FomcVote>()
  const weightedVotes: Record<FomcVote, number> = {
    raise: 0,
    cut: 0,
    hold: 0,
    qe: 0,
    qt: 0,
  }

  for (const member of committee) {
    const vote = getMemberVote(member, state)
    votes.set(member.id, vote)
    weightedVotes[vote] += member.weight
  }

  // Determine majority decision
  let decision: FomcVote = 'hold'
  let maxWeight = 0

  for (const [vote, weight] of Object.entries(weightedVotes) as [FomcVote, number][]) {
    if (weight > maxWeight) {
      maxWeight = weight
      decision = vote
    }
  }

  // If player overrides, use their action
  if (playerOverride) {
    if (typeof playerOverride === 'string') {
      decision = playerOverride as FomcVote
    } else if (playerOverride.type === 'rate') {
      decision = playerOverride.direction as FomcVote
    } else if (playerOverride.type === 'balance_sheet') {
      decision = playerOverride.operation === 'qe' ? 'qe' : playerOverride.operation === 'qt' ? 'qt' : 'hold'
    }
  }

  // Identify dissenters
  const dissenters = Array.from(votes.entries())
    .filter(([, vote]) => vote !== decision)
    .map(([id]) => id)

  // Generate statement
  const statement = generateFomcStatement(state, decision, dissenters.length)

  // Determine press conference tone
  let pressConferenceTone: FomcMeeting['pressConferenceTone'] = 'balanced'
  if (decision === 'raise' || decision === 'qt') {
    pressConferenceTone = 'hawkish'
  } else if (decision === 'cut' || decision === 'qe') {
    pressConferenceTone = 'dovish'
  }

  return {
    turn: state.turn,
    votes,
    decision,
    dissenters,
    statement,
    pressConferenceTone,
  }
}

/**
 * Generate FOMC statement text
 */
function generateFomcStatement(
  state: GameState,
  decision: FomcVote,
  dissentCount: number
): string {
  const inflation = state.macro.coreInflation
  const unemployment = state.macro.unemploymentRate
  const growth = state.macro.gdpGrowth

  // Economic assessment
  let assessment = ''
  if (growth > 2.5) {
    assessment = 'Economic activity has been expanding at a solid pace.'
  } else if (growth > 0.5) {
    assessment = 'Economic activity has been expanding at a moderate pace.'
  } else if (growth > -0.5) {
    assessment = 'Economic activity has been advancing modestly.'
  } else {
    assessment = 'Economic activity has slowed considerably.'
  }

  // Labor market
  let labor = ''
  if (unemployment < 4) {
    labor = 'The labor market remains very tight, with job gains robust.'
  } else if (unemployment < 5) {
    labor = 'Job gains have been solid, and unemployment remains low.'
  } else if (unemployment < 6) {
    labor = 'Labor market conditions have softened somewhat.'
  } else {
    labor = 'The labor market has weakened, with unemployment elevated.'
  }

  // Inflation
  let inflationText = ''
  if (inflation > 4) {
    inflationText = 'Inflation remains well above the Committee\'s 2 percent objective.'
  } else if (inflation > 2.5) {
    inflationText = 'Inflation remains elevated but has shown signs of moderating.'
  } else if (inflation > 1.5) {
    inflationText = 'Inflation has moved closer to the Committee\'s 2 percent objective.'
  } else {
    inflationText = 'Inflation remains below the Committee\'s 2 percent objective.'
  }

  // Action
  let action = ''
  switch (decision) {
    case 'raise':
      action = 'The Committee decided to raise the target range for the federal funds rate by 25 basis points.'
      break
    case 'cut':
      action = 'The Committee decided to lower the target range for the federal funds rate by 25 basis points.'
      break
    case 'hold':
      action = 'The Committee decided to maintain the target range for the federal funds rate.'
      break
    case 'qe':
      action = 'The Committee will continue to increase its holdings of Treasury securities and agency MBS.'
      break
    case 'qt':
      action = 'The Committee will continue reducing its holdings of Treasury securities and agency MBS.'
      break
  }

  // Dissent note
  let dissent = ''
  if (dissentCount > 0) {
    dissent = ` Voting against this action: ${dissentCount} member${dissentCount > 1 ? 's' : ''}.`
  }

  return `${assessment} ${labor} ${inflationText}\n\n${action}${dissent}`
}

// ============================================================================
// DOT PLOT
// ============================================================================

export type DotPlotData = {
  year: string
  dots: number[]
  median: number
  range: [number, number]
}

/**
 * Generate dot plot data from committee projections
 */
export function generateDotPlot(committee: FomcMember[], state: GameState): DotPlotData[] {
  const years = ['2024', '2025', '2026', 'Long Run']
  const result: DotPlotData[] = []

  for (const year of years) {
    const dots: number[] = []

    for (const member of committee) {
      const projections = getMemberProjections(member, state)
      if (projections[year] !== undefined) {
        dots.push(projections[year])
      }
    }

    dots.sort((a, b) => a - b)
    const median = dots[Math.floor(dots.length / 2)]
    const range: [number, number] = [dots[0], dots[dots.length - 1]]

    result.push({ year, dots, median, range })
  }

  return result
}

// ============================================================================
// FOMC CALENDAR
// ============================================================================

/**
 * Get the FOMC meeting schedule (simplified - 8 per year)
 */
export function getFomcCalendar(year: number): Date[] {
  // FOMC meets roughly every 6 weeks
  // Jan, Mar, May, Jun, Jul, Sep, Nov, Dec
  return [
    new Date(year, 0, 31),  // Late January
    new Date(year, 2, 20),  // March
    new Date(year, 4, 3),   // Early May
    new Date(year, 5, 14),  // June
    new Date(year, 6, 26),  // Late July
    new Date(year, 8, 17),  // September
    new Date(year, 10, 1),  // November
    new Date(year, 11, 13), // December
  ]
}

/**
 * Check if current turn has a press conference (every other meeting)
 */
export function hasPresser(turn: number): boolean {
  // Press conferences at meetings 1, 3, 5, 7 (every other)
  return turn % 2 === 1
}

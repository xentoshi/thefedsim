// src/engine/news.ts
// Procedural news headline generation based on economic state

import { GameState, NewsItem, GameEvent, FomcMeeting } from './types'

// ============================================================================
// HEADLINE TEMPLATES
// ============================================================================

type HeadlineTemplate = {
  condition: (state: GameState) => boolean
  headlines: string[]
  category: NewsItem['category']
  sentiment: NewsItem['sentiment']
}

const HEADLINE_TEMPLATES: HeadlineTemplate[] = [
  // ========== INFLATION ==========
  {
    condition: (s) => s.macro.coreInflation > 6,
    headlines: [
      'Inflation Crisis Deepens: Core CPI Hits {inflation}%',
      'Consumer Prices Surge as Inflation Spirals to {inflation}%',
      'Fed Under Fire as Inflation Remains Stubbornly High at {inflation}%',
    ],
    category: 'economy',
    sentiment: 'negative',
  },
  {
    condition: (s) => s.macro.coreInflation > 4 && s.macro.coreInflation <= 6,
    headlines: [
      'Inflation Remains Elevated at {inflation}%, Fed Weighs Options',
      'Price Pressures Persist: Inflation at {inflation}%',
      'Consumers Feel the Pinch as Inflation Stays Above {inflation}%',
    ],
    category: 'economy',
    sentiment: 'negative',
  },
  {
    condition: (s) => s.macro.coreInflation < 2 && s.macro.coreInflation > 0,
    headlines: [
      'Inflation Cools to {inflation}%, Below Fed Target',
      'Price Growth Slows: Is Deflation a Risk?',
      'Inflation Undershoots at {inflation}%, Raising Growth Concerns',
    ],
    category: 'economy',
    sentiment: 'neutral',
  },
  {
    condition: (s) => s.macro.coreInflation >= 1.8 && s.macro.coreInflation <= 2.3,
    headlines: [
      'Goldilocks: Inflation Holds Steady at {inflation}%',
      'Fed Hits Target: Inflation at {inflation}%',
      'Price Stability Achieved as Inflation Settles at {inflation}%',
    ],
    category: 'economy',
    sentiment: 'positive',
  },

  // ========== EMPLOYMENT ==========
  {
    condition: (s) => s.macro.unemploymentRate < 3.5,
    headlines: [
      'Labor Market Red Hot: Unemployment Falls to {unemployment}%',
      'Workers in Demand: Jobless Rate at Historic Low of {unemployment}%',
      'Employers Struggle to Hire as Unemployment Hits {unemployment}%',
    ],
    category: 'economy',
    sentiment: 'positive',
  },
  {
    condition: (s) => s.macro.unemploymentRate > 7,
    headlines: [
      'Unemployment Surges to {unemployment}% as Layoffs Mount',
      'Jobs Crisis: {unemployment}% Unemployed',
      'Labor Market in Freefall: Jobless Rate Hits {unemployment}%',
    ],
    category: 'economy',
    sentiment: 'negative',
  },
  {
    condition: (s) => s.macro.unemploymentRate > 5 && s.macro.unemploymentRate <= 7,
    headlines: [
      'Unemployment Rises to {unemployment}% Amid Slowdown',
      'Job Market Softens: Unemployment at {unemployment}%',
      'Workers Face Headwinds as Jobless Rate Climbs to {unemployment}%',
    ],
    category: 'economy',
    sentiment: 'negative',
  },

  // ========== GDP ==========
  {
    condition: (s) => s.macro.gdpGrowth < -2,
    headlines: [
      'Recession Confirmed: GDP Contracts {gdp}%',
      'Economy in Freefall as GDP Shrinks {gdp}%',
      'Deep Recession: Output Drops {gdp}%',
    ],
    category: 'economy',
    sentiment: 'negative',
  },
  {
    condition: (s) => s.macro.gdpGrowth < 0 && s.macro.gdpGrowth >= -2,
    headlines: [
      'Economy Contracts {gdp}%, Recession Fears Grow',
      'GDP Turns Negative at {gdp}%',
      'Growth Stalls: Economy Shrinks {gdp}%',
    ],
    category: 'economy',
    sentiment: 'negative',
  },
  {
    condition: (s) => s.macro.gdpGrowth > 4,
    headlines: [
      'Economy Booms: GDP Surges {gdp}%',
      'Blockbuster Growth: Economy Expands {gdp}%',
      'Red-Hot Economy Posts {gdp}% Growth',
    ],
    category: 'economy',
    sentiment: 'positive',
  },

  // ========== MARKETS ==========
  {
    condition: (s) => s.financial.spxVolatility > 35,
    headlines: [
      'Market Turmoil: VIX Spikes to {vix}',
      'Wall Street in Chaos as Fear Index Hits {vix}',
      'Volatility Explodes: VIX at {vix}',
    ],
    category: 'markets',
    sentiment: 'negative',
  },
  {
    condition: (s) => s.financial.spxLevel > 5000 && s.financial.spxVolatility < 18,
    headlines: [
      'Stocks Hit New Highs: S&P 500 at {spx}',
      'Bull Market Roars: S&P Climbs to {spx}',
      'Wall Street Celebration as Stocks Reach {spx}',
    ],
    category: 'markets',
    sentiment: 'positive',
  },
  {
    condition: (s) => s.financial.yield2y > s.financial.yield10y,
    headlines: [
      'Yield Curve Inverts: Recession Signal Flashes',
      '2-Year Yield Tops 10-Year in Ominous Sign',
      'Bond Market Sends Warning: Curve Inverts',
    ],
    category: 'markets',
    sentiment: 'negative',
  },
  {
    condition: (s) => s.financial.creditSpread > 4,
    headlines: [
      'Credit Markets Seize: Spreads Blow Out to {spread}%',
      'Corporate Bond Stress: Credit Spreads at {spread}%',
      'Flight to Safety as Credit Spreads Hit {spread}%',
    ],
    category: 'markets',
    sentiment: 'negative',
  },

  // ========== FED ==========
  {
    condition: (s) => s.credibility.overallScore < 50,
    headlines: [
      'Fed Credibility Crisis: Trust in Central Bank Plummets',
      'Markets Lose Faith in Federal Reserve',
      'Fed Faces Credibility Gap as Confidence Falls',
    ],
    category: 'fed',
    sentiment: 'negative',
  },
  {
    condition: (s) => s.credibility.overallScore > 85,
    headlines: [
      'Markets Trust Powell: Fed Credibility at Multi-Year High',
      'Fed Commands Confidence as Policy Hits Mark',
      'Central Bank Credibility Soars',
    ],
    category: 'fed',
    sentiment: 'positive',
  },
  {
    condition: (s) => s.balanceSheet.totalAssets > 9000,
    headlines: [
      'Fed Balance Sheet Balloons Past $9 Trillion',
      'QE in Overdrive: Fed Assets Hit Record',
      'Central Bank Balance Sheet Expands Further',
    ],
    category: 'fed',
    sentiment: 'neutral',
  },

  // ========== POLITICS ==========
  {
    condition: (s) => s.credibility.independencePerception < 60,
    headlines: [
      'Fed Independence Under Threat, Analysts Warn',
      'Political Pressure on Fed Intensifies',
      'Central Bank Autonomy Questioned',
    ],
    category: 'politics',
    sentiment: 'negative',
  },

  // ========== GLOBAL ==========
  {
    condition: (s) => s.external.oilPrice > 100,
    headlines: [
      'Oil Surges Past $100: Energy Crisis Deepens',
      'Crude at ${oil}/Barrel as Supply Fears Mount',
      'Energy Shock: Oil Prices Spike to ${oil}',
    ],
    category: 'global',
    sentiment: 'negative',
  },
  {
    condition: (s) => s.financial.dollarIndex > 110,
    headlines: [
      'Dollar Dominance: Greenback Surges to {dxy}',
      'Strong Dollar Squeezes Global Trade',
      'King Dollar: Index Hits {dxy}',
    ],
    category: 'global',
    sentiment: 'neutral',
  },
]

// ============================================================================
// NEWS GENERATION
// ============================================================================

/**
 * Fill template variables
 */
function fillTemplate(template: string, state: GameState): string {
  return template
    .replace('{inflation}', state.macro.coreInflation.toFixed(1))
    .replace('{unemployment}', state.macro.unemploymentRate.toFixed(1))
    .replace('{gdp}', Math.abs(state.macro.gdpGrowth).toFixed(1))
    .replace('{vix}', state.financial.spxVolatility.toFixed(0))
    .replace('{spx}', state.financial.spxLevel.toFixed(0))
    .replace('{spread}', state.financial.creditSpread.toFixed(1))
    .replace('{oil}', state.external.oilPrice.toFixed(0))
    .replace('{dxy}', state.financial.dollarIndex.toFixed(1))
    .replace('{rate}', state.financial.fedFundsRate.toFixed(2))
}

/**
 * Generate news items based on current state
 */
export function generateNews(
  state: GameState,
  random: () => number,
  count: number = 3
): NewsItem[] {
  const news: NewsItem[] = []
  const matchingTemplates = HEADLINE_TEMPLATES.filter((t) => t.condition(state))

  // Shuffle and pick
  const shuffled = matchingTemplates.sort(() => random() - 0.5)
  const selected = shuffled.slice(0, count)

  for (const template of selected) {
    const headlineTemplate = template.headlines[Math.floor(random() * template.headlines.length)]
    const headline = fillTemplate(headlineTemplate, state)

    news.push({
      id: `news_${state.turn}_${random().toString(36).slice(2, 8)}`,
      timestamp: state.currentDate,
      headline,
      category: template.category,
      sentiment: template.sentiment,
    })
  }

  return news
}

// ============================================================================
// EVENT NEWS
// ============================================================================

/**
 * Generate news for a game event
 */
export function generateEventNews(event: GameEvent, state: GameState): NewsItem {
  return {
    id: `event_${event.id}_${state.turn}`,
    timestamp: state.currentDate,
    headline: event.headline,
    category: event.category === 'market' ? 'markets' :
              event.category === 'political' ? 'politics' :
              event.category === 'global' ? 'global' : 'economy',
    sentiment: event.severity === 'minor' || event.severity === 'moderate' ? 'neutral' : 'negative',
  }
}

// ============================================================================
// FOMC NEWS
// ============================================================================

/**
 * Generate news for an FOMC decision
 */
export function generateFomcNews(meeting: FomcMeeting, state: GameState): NewsItem {
  let headline: string
  let sentiment: NewsItem['sentiment'] = 'neutral'

  switch (meeting.decision) {
    case 'raise':
      headline = `Fed Raises Rates: Target Range Now ${(state.financial.fedFundsRate).toFixed(2)}%-${(state.financial.fedFundsRate + 0.25).toFixed(2)}%`
      sentiment = state.macro.coreInflation > 3 ? 'positive' : 'negative'
      break
    case 'cut':
      headline = `Fed Cuts Rates: Target Range Now ${(state.financial.fedFundsRate).toFixed(2)}%-${(state.financial.fedFundsRate + 0.25).toFixed(2)}%`
      sentiment = state.macro.gdpGrowth < 1 ? 'positive' : 'neutral'
      break
    case 'hold':
      headline = `Fed Holds Steady: Rates Unchanged at ${state.financial.fedFundsRate.toFixed(2)}%`
      sentiment = 'neutral'
      break
    case 'qe':
      headline = 'Fed Expands Asset Purchases to Support Economy'
      sentiment = 'neutral'
      break
    case 'qt':
      headline = 'Fed Continues Balance Sheet Reduction'
      sentiment = 'neutral'
      break
  }

  // Add dissent note
  if (meeting.dissenters.length > 0) {
    headline += ` (${meeting.dissenters.length} dissent${meeting.dissenters.length > 1 ? 's' : ''})`
  }

  return {
    id: `fomc_${state.turn}`,
    timestamp: state.currentDate,
    headline,
    category: 'fed',
    sentiment,
  }
}

// ============================================================================
// DATA RELEASE NEWS
// ============================================================================

type DataRelease = {
  name: string
  getValue: (state: GameState) => number
  format: (value: number) => string
  category: NewsItem['category']
  thresholds: {
    positive: (value: number, prev: number) => boolean
    negative: (value: number, prev: number) => boolean
  }
  templates: {
    positive: string[]
    negative: string[]
    neutral: string[]
  }
}

const DATA_RELEASES: DataRelease[] = [
  {
    name: 'CPI',
    getValue: (s) => s.macro.cpiInflation,
    format: (v) => `${v.toFixed(1)}%`,
    category: 'economy',
    thresholds: {
      positive: (v) => v < 2.5,
      negative: (v) => v > 4,
    },
    templates: {
      positive: ['CPI Cools to {value}, Below Expectations', 'Inflation Eases: CPI at {value}'],
      negative: ['CPI Hot at {value}, Above Forecasts', 'Inflation Surprises to Upside at {value}'],
      neutral: ['CPI Prints at {value}, In Line with Expectations'],
    },
  },
  {
    name: 'Jobs Report',
    getValue: (s) => s.macro.unemploymentRate,
    format: (v) => `${v.toFixed(1)}%`,
    category: 'economy',
    thresholds: {
      positive: (v) => v < 4,
      negative: (v) => v > 5.5,
    },
    templates: {
      positive: ['Strong Jobs Report: Unemployment at {value}', 'Labor Market Remains Tight at {value}'],
      negative: ['Weak Jobs Report: Unemployment Rises to {value}', 'Labor Market Softens: Jobless Rate at {value}'],
      neutral: ['Jobs Report: Unemployment Holds at {value}'],
    },
  },
  {
    name: 'GDP',
    getValue: (s) => s.macro.gdpGrowth,
    format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`,
    category: 'economy',
    thresholds: {
      positive: (v) => v > 3,
      negative: (v) => v < 0,
    },
    templates: {
      positive: ['GDP Surges {value} in Q{quarter}', 'Economy Grows {value}, Beating Expectations'],
      negative: ['GDP Contracts {value} in Q{quarter}', 'Economy Shrinks {value}, Recession Fears Rise'],
      neutral: ['GDP Grows {value} in Q{quarter}, Matching Forecasts'],
    },
  },
]

/**
 * Generate a data release news item
 */
export function generateDataReleaseNews(
  state: GameState,
  releaseType: string,
  random: () => number
): NewsItem | null {
  const release = DATA_RELEASES.find((r) => r.name === releaseType)
  if (!release) return null

  const value = release.getValue(state)
  let sentiment: NewsItem['sentiment'] = 'neutral'
  let templates = release.templates.neutral

  if (release.thresholds.positive(value, 0)) {
    sentiment = 'positive'
    templates = release.templates.positive
  } else if (release.thresholds.negative(value, 0)) {
    sentiment = 'negative'
    templates = release.templates.negative
  }

  const template = templates[Math.floor(random() * templates.length)]
  const quarter = Math.floor((state.turn % 8) / 2) + 1
  const headline = template
    .replace('{value}', release.format(value))
    .replace('{quarter}', quarter.toString())

  return {
    id: `data_${releaseType}_${state.turn}`,
    timestamp: state.currentDate,
    headline,
    category: release.category,
    sentiment,
  }
}

// ============================================================================
// NEWS TICKER
// ============================================================================

/**
 * Generate a full news ticker for a turn
 */
export function generateNewsTicker(
  state: GameState,
  events: GameEvent[],
  meeting: FomcMeeting | null,
  random: () => number
): NewsItem[] {
  const news: NewsItem[] = []

  // Add event news first (most important)
  for (const event of events) {
    news.push(generateEventNews(event, state))
  }

  // Add FOMC news if there was a meeting
  if (meeting) {
    news.push(generateFomcNews(meeting, state))
  }

  // Add general news based on state
  const generalNews = generateNews(state, random, 2)
  news.push(...generalNews)

  // Add data release (every few turns)
  if (state.turn % 3 === 0) {
    const releases = ['CPI', 'Jobs Report', 'GDP']
    const release = releases[state.turn % releases.length]
    const dataNews = generateDataReleaseNews(state, release, random)
    if (dataNews) news.push(dataNews)
  }

  // Sort by importance (events first, then fed, then others)
  const categoryOrder = ['fed', 'economy', 'markets', 'politics', 'global']
  news.sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category))

  return news.slice(0, 6) // Max 6 headlines
}

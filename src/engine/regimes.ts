// Economic regime detection and historical parallels
import type { GameState } from './types'

export type EconomicRegime = {
  name: string
  shortName: string
  color: string
  bg: string
  description: string
}

export function getEconomicRegime(state: GameState): EconomicRegime {
  const inf   = state.macro.coreInflation
  const unemp = state.macro.unemploymentRate
  const gdp   = state.macro.gdpGrowth

  if (inf > 4 && unemp > 5.5)
    return { name: 'Stagflation', shortName: 'STAGFLATION', color: '#ff9800', bg: 'rgba(255,152,0,0.1)', description: 'High inflation + weak employment. The hardest problem in central banking.' }

  if (gdp < -0.5)
    return { name: 'Recession', shortName: 'RECESSION', color: '#ef5350', bg: 'rgba(239,83,80,0.1)', description: 'Economic contraction. Stimulus likely needed.' }

  if (inf > 3.5 && unemp < 4)
    return { name: 'Overheating', shortName: 'OVERHEATING', color: '#ef5350', bg: 'rgba(239,83,80,0.1)', description: 'Economy running too hot. Tightening needed.' }

  if (inf < 0.8)
    return { name: 'Deflation Risk', shortName: 'DEFLATION RISK', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', description: 'Inflation falling toward zero. Demand may be collapsing.' }

  if (inf >= 1.5 && inf <= 2.8 && unemp >= 3.8 && unemp <= 5.2 && gdp > 0)
    return { name: 'Goldilocks', shortName: 'GOLDILOCKS', color: '#26a69a', bg: 'rgba(38,166,154,0.1)', description: 'Near-perfect conditions. Inflation on target, full employment.' }

  if (gdp > 0 && gdp < 1.5 && unemp > 5.5)
    return { name: 'Recovery', shortName: 'RECOVERY', color: '#2196f3', bg: 'rgba(33,150,243,0.1)', description: 'Below-potential growth. Labor market still healing.' }

  if (inf > 2.8)
    return { name: 'Above Target', shortName: 'ABOVE TARGET', color: '#ff9800', bg: 'rgba(255,152,0,0.1)', description: 'Inflation above 2% target. Monitor closely.' }

  if (inf < 1.5)
    return { name: 'Below Target', shortName: 'BELOW TARGET', color: '#2196f3', bg: 'rgba(33,150,243,0.1)', description: 'Inflation below mandate. Consider easing.' }

  return { name: 'Stable', shortName: 'STABLE', color: '#9598a1', bg: 'rgba(149,152,161,0.1)', description: 'Economy near equilibrium.' }
}

export type HistoricalParallel = {
  period: string
  headline: string
  detail: string
}

export function getHistoricalParallel(state: GameState): HistoricalParallel {
  const inf   = state.macro.coreInflation
  const unemp = state.macro.unemploymentRate
  const gdp   = state.macro.gdpGrowth
  const fed   = state.financial.fedFundsRate
  const vix   = state.financial.spxVolatility

  if (vix > 45 && gdp < -1)
    return {
      period: 'US 2008 Q4',
      headline: 'Global Financial Crisis',
      detail: 'Lehman collapse triggered a global credit freeze. Bernanke deployed TARP, QE1, and ZIRP to prevent a second Great Depression. VIX hit 80.',
    }

  if (inf > 6 && unemp > 6)
    return {
      period: 'US 1974–75',
      headline: 'Great Stagflation',
      detail: 'Oil shocks + loose fiscal policy created the dreaded stagflation. Fed Chair Burns raised rates but flinched repeatedly — credibility collapsed. Volcker inherited the mess.',
    }

  if (inf > 5 && fed > 10)
    return {
      period: 'US 1981–82',
      headline: 'Volcker Shock',
      detail: 'Volcker raised rates to 20% to kill 13% inflation. It caused a deep recession but permanently anchored inflation expectations. The most painful — and most effective — Fed action in history.',
    }

  if (gdp < -3)
    return {
      period: 'US 2020 Q2',
      headline: 'COVID Recession',
      detail: 'Fastest recession in US history — GDP fell 33% annualized in one quarter. The Fed cut to zero and launched $3T in QE within weeks. Speed mattered more than precision.',
    }

  if (inf > 4.5 && fed < 2.5)
    return {
      period: 'US 2022 Q1',
      headline: 'Post-COVID Inflation Surge',
      detail: 'Supply chain chaos + $5T in fiscal stimulus created the worst inflation since 1981. The Fed was "behind the curve" — still buying bonds while inflation hit 7%. Markets were furious.',
    }

  if (vix > 35 && gdp < 0 && inf < 3)
    return {
      period: 'US 2001',
      headline: 'Dot-com Bust',
      detail: 'NASDAQ fell 78%. Greenspan cut aggressively to ~1% — perhaps too far, seeding the housing bubble. Deflation risk was real but never materialized. Classic Fed overreach debate.',
    }

  if (inf < 2.5 && unemp < 4.5 && gdp > 2.5)
    return {
      period: 'US 1995–2000',
      headline: '"New Economy" Goldilocks',
      detail: 'Productivity boom drove strong growth without inflation. Greenspan coined "irrational exuberance" in 1996 but kept policy accommodative. The best macro conditions in postwar history.',
    }

  if (inf < 0.8 && fed < 1 && unemp > 3.5)
    return {
      period: 'Japan 1998–2012',
      headline: 'Lost Decade(s)',
      detail: 'Japan kept rates near zero for 20 years but couldn\'t escape deflation. QE helped but demographic headwinds and zombie banks proved too powerful. A cautionary tale on secular stagnation.',
    }

  if (inf < 2 && unemp < 5 && fed > 0.5 && fed < 3)
    return {
      period: 'US 2015–2018',
      headline: 'Yellen Normalization',
      detail: 'After years at zero, Yellen raised rates "gradual and patient." Inflation stayed stubbornly below target — a puzzle. The economy absorbed tightening with barely a shudder.',
    }

  return {
    period: 'US 2023–24',
    headline: 'Soft Landing Attempt',
    detail: 'The Fed held at 5.25% as inflation cooled from 9% to near-target. A rare potential soft landing — if growth holds and the labor market doesn\'t crack. Outcome still uncertain.',
  }
}

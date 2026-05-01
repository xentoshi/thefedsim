'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SimplePolicyAction, GameState } from '@/engine/types'

type QA = { reporter: string; question: string; answer: string }

function getPressConferenceQA(action: SimplePolicyAction, state: GameState): QA[] {
  const inf   = state.macro.coreInflation
  const unemp = state.macro.unemploymentRate
  const gdp   = state.macro.gdpGrowth
  const fed   = state.financial.fedFundsRate
  const turn  = state.turn

  const qas: QA[] = []

  // Q1 — always about the decision taken
  if (action === 'raise') {
    qas.push({
      reporter: 'Nick Timiraos, Wall Street Journal',
      question: `Chair, with unemployment at ${unemp.toFixed(1)}%, how confident are you this hike won't push us into recession?`,
      answer: inf > 3
        ? `We remain firmly committed to price stability. Inflation at ${inf.toFixed(1)}% is unacceptable. We acknowledge the labor market risk, but sustained high inflation causes far greater long-term harm to working Americans than a period of restraint.`
        : `We believe the economy can absorb this adjustment. The labor market has sufficient resilience. We'll continue to monitor the data closely and stand ready to adjust if warranted.`,
    })
  } else if (action === 'cut') {
    qas.push({
      reporter: 'Howard Schneider, Reuters',
      question: `Chair, with inflation at ${inf.toFixed(1)}%, why cut now? Aren't you declaring victory prematurely?`,
      answer: unemp > 5
        ? `The balance of risks has shifted. We've made substantial progress. Our mandate is dual — price stability AND maximum employment. With unemployment at ${unemp.toFixed(1)}%, we can't ignore the employment side of that mandate.`
        : `We're not declaring victory — we're recalibrating. Inflation has moderated meaningfully and we see a path to 2% without sacrificing the labor market. This is data-dependent, not a predetermined path.`,
    })
  } else if (action === 'hold') {
    qas.push({
      reporter: 'Rachel Siegel, Washington Post',
      question: `Markets expected a move today. What would it take to change your stance at the next meeting?`,
      answer: `We're in a meeting-by-meeting mode. Today's decision reflects our assessment that current policy is appropriate. We're watching: inflation data — particularly the trimmed mean PCE — labor market indicators, and financial conditions. We are not pre-committing to any path.`,
    })
  } else if (action === 'qe') {
    qas.push({
      reporter: 'Michael Derby, Dow Jones',
      question: `Chair, QE was controversial after 2008. What guardrails prevent the balance sheet from becoming permanently inflated?`,
      answer: `This is a temporary, targeted intervention to ensure financial markets function. We've learned from the post-2008 experience. Our tapering framework is clearer, our communication more explicit. We will normalize when conditions warrant — and we mean it.`,
    })
  } else {
    qas.push({
      reporter: 'Ann Saphir, Reuters',
      question: `Chair, QT reduces reserves. How do you know when to stop before triggering repo market stress — like 2019?`,
      answer: `We're proceeding carefully and monitoring reserve levels, repo rates, and overnight funding markets closely. We have tools to respond quickly if we see stress. Our aim is to reduce the balance sheet to the minimum needed for efficient monetary policy — no more, no less.`,
    })
  }

  // Q2 — about the most pressing macro issue
  if (inf > 4) {
    qas.push({
      reporter: 'Jeanna Smialek, New York Times',
      question: `Inflation is at ${inf.toFixed(1)}%. When do you realistically expect to hit 2%?`,
      answer: `We expect continued progress toward our 2% objective, but the path will be uneven. Services inflation — particularly shelter — remains sticky. We're not satisfied with ${inf.toFixed(1)}% and we'll maintain restrictive policy as long as necessary to finish the job.`,
    })
  } else if (unemp > 6) {
    qas.push({
      reporter: 'Victoria Guida, Politico',
      question: `Unemployment is at ${unemp.toFixed(1)}%. Is the Fed doing enough to protect workers?`,
      answer: `We're watching the labor market very carefully. Our baseline expects the market to rebalance without significant dislocation. But we're prepared to act more aggressively if needed. No one wants to see Americans lose jobs unnecessarily — that is not a tradeoff we take lightly.`,
    })
  } else if (gdp < 0) {
    qas.push({
      reporter: 'Heather Long, Washington Post',
      question: `GDP is contracting. Are we already in recession? And is the Fed partly responsible?`,
      answer: `We monitor a broad range of indicators beyond the GDP headline. Consumer spending, business investment, the labor market — these tell a more complete story. We acknowledge that tighter monetary policy has a slowing effect, but our mandate requires us to restore price stability. That work is not yet done.`,
    })
  } else {
    qas.push({
      reporter: 'Craig Torres, Bloomberg',
      question: `After ${turn} meetings, how do you assess the state of the economy?`,
      answer: inf < 2.5 && unemp < 5
        ? `We're cautiously optimistic. Inflation is near target, employment is near maximum, and growth is healthy. This is what we set out to achieve. We remain vigilant — conditions can change quickly — but the data supports a positive assessment.`
        : `We've made meaningful progress, but the job isn't complete. We'll continue to evaluate incoming data at every meeting and adjust policy as appropriate. We are committed to both sides of our mandate.`,
    })
  }

  // Q3 — about the policy path / neutral rate
  qas.push({
    reporter: 'Chris Rugaber, Associated Press',
    question: `What is your estimate of the neutral rate, and how far is current policy from it?`,
    answer: fed > 4.5
      ? `Our estimate of the longer-run neutral rate is in the range of 2.5 to 3.5%. At ${fed.toFixed(2)}%, policy is clearly restrictive. We believe that's appropriate given the inflation environment. We'll loosen our foot on the brake as confidence builds that inflation is durably heading to 2%.`
      : fed < 2
      ? `Policy is accommodative at ${fed.toFixed(2)}%. With the neutral rate near 2.5%, we have room to normalize. The pace depends entirely on how data evolve. We won't be in a hurry, but we also won't be complacent if conditions change.`
      : `At ${fed.toFixed(2)}%, we believe we're operating near neutral territory. The economy doesn't need significant stimulus or significant restraint at this moment. We're in a good position to move in either direction as data warrants.`,
  })

  return qas
}

type Props = {
  action: SimplePolicyAction
  state: GameState
  onDismiss: () => void
}

export function PressConferenceModal({ action, state, onDismiss }: Props) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const qas = getPressConferenceQA(action, state)

  const toggle = (i: number) =>
    setRevealed(prev => {
      const s = new Set(prev)
      if (s.has(i)) { s.delete(i) } else { s.add(i) }
      return s
    })

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onDismiss} />

        <motion.div
          className="relative w-full max-w-lg mx-4 rounded-sm overflow-hidden"
          style={{ maxHeight: '85vh', overflowY: 'auto', background: 'var(--g-surface)', border: '1px solid rgba(41,98,255,0.3)', boxShadow: '0 0 48px rgba(41,98,255,0.12), 0 24px 64px rgba(0,0,0,0.9)' }}
          initial={{ scale: 0.9, y: 32 }} animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.93, y: 20 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="h-0.5 w-full" style={{ background: 'var(--g-brand)' }} />

          {/* Header */}
          <div className="px-5 py-4 flex items-center gap-3"
            style={{ borderBottom: '1px solid var(--g-border)', background: 'var(--g-raised)' }}>
            <span className="text-2xl">🎙</span>
            <div>
              <div className="g-label mb-0.5" style={{ color: 'var(--g-brand)' }}>FOMC Press Conference</div>
              <div className="text-sm font-black" style={{ fontFamily: 'var(--g-font-display)', color: 'var(--g-txt-1)' }}>
                Meeting {state.turn} — Q&A Session
              </div>
            </div>
            <div className="ml-auto g-label" style={{ color: 'var(--g-txt-3)' }}>
              {revealed.size}/{qas.length} answered
            </div>
          </div>

          {/* Q&A */}
          <div className="px-5 py-4 space-y-5">
            {qas.map((qa, i) => (
              <div key={i}>
                {/* Reporter + Question */}
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(41,98,255,0.12)', color: 'var(--g-brand)', fontFamily: 'var(--g-font-data)', letterSpacing: '0.05em' }}>
                    Q
                  </span>
                  <div>
                    <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--g-txt-3)', fontFamily: 'var(--g-font-data)' }}>
                      {qa.reporter}
                    </div>
                    <p className="text-xs leading-relaxed italic" style={{ color: 'var(--g-txt-2)', fontFamily: 'var(--g-font-data)' }}>
                      &ldquo;{qa.question}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Answer */}
                {revealed.has(i) ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-start gap-2 ml-6"
                  >
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(38,166,154,0.12)', color: 'var(--g-up)', fontFamily: 'var(--g-font-data)', letterSpacing: '0.05em' }}>
                      A
                    </span>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--g-txt-1)', fontFamily: 'var(--g-font-data)' }}>
                      {qa.answer}
                    </p>
                  </motion.div>
                ) : (
                  <div className="ml-6">
                    <button
                      onClick={() => toggle(i)}
                      className="text-xs font-bold py-1 px-3 rounded-sm transition-all hover:brightness-110"
                      style={{ background: 'rgba(41,98,255,0.08)', color: 'var(--g-brand)', border: '1px solid rgba(41,98,255,0.2)', fontFamily: 'var(--g-font-data)' }}
                    >
                      Answer →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="px-5 pb-5">
            <button onClick={onDismiss}
              className="w-full py-2.5 rounded-sm font-black text-sm transition-all hover:brightness-110"
              style={{ background: 'var(--g-brand)', color: 'white', fontFamily: 'var(--g-font-display)' }}>
              End Press Conference
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

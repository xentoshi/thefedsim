'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const STEPS = [
  {
    icon: '🏛',
    tag: 'WELCOME',
    tagColor: 'var(--g-brand)',
    title: 'You are Jerome Powell.',
    body: 'Every 6 weeks, the Federal Open Market Committee meets and you set the direction of the US economy. One decision can ripple through millions of mortgages, jobs, and savings accounts.',
    note: 'This simulation mirrors real Fed mechanics — the numbers, tools, and tradeoffs are based on actual monetary policy.',
  },
  {
    icon: '⚖',
    tag: 'THE MANDATE',
    tagColor: 'var(--g-up)',
    title: 'Two goals. One lever.',
    body: 'Congress gave the Fed a dual mandate: keep inflation at 2% and maximize employment. These goals pull in opposite directions — cutting rates fights unemployment but risks inflation. Raising fights inflation but risks recession.',
    note: 'No Fed chair has ever perfectly satisfied both sides of the mandate simultaneously. That\'s what makes this hard.',
  },
  {
    icon: '📊',
    tag: 'LEFT PANEL',
    tagColor: 'var(--g-brand)',
    title: 'Your four vital signs.',
    points: [
      { label: 'Inflation (PCE)', color: 'var(--g-warn)', desc: 'Target: 2%. Below 1% → deflation risk. Above 4% → credibility crisis.' },
      { label: 'Unemployment', color: 'var(--g-up)', desc: 'Natural rate ~4.5%. Too low = overheating. Too high = recession.' },
      { label: 'GDP Growth', color: 'var(--g-info)', desc: 'Two consecutive negative quarters = technical recession.' },
      { label: 'Credibility', color: '#a855f7', desc: 'Your most valuable asset. Lost slowly, gone quickly. Hard to rebuild.' },
    ],
  },
  {
    icon: '📈',
    tag: 'CENTER CHART',
    tagColor: 'var(--g-txt-3)',
    title: 'The market is watching you.',
    body: 'Each candle is one FOMC meeting (~6 weeks). Markets price in your decisions before you make them. A sustained rally means confidence. A crash means you lost the room.',
    note: 'The regime badge in the chart header (e.g. GOLDILOCKS, OVERHEATING) tells you where you are in the economic cycle at a glance.',
  },
  {
    icon: '〰',
    tag: 'RIGHT PANEL — TOP',
    tagColor: 'var(--g-down)',
    title: 'Read the yield curve first.',
    body: 'The yield curve shows what bond markets expect about the future. Under normal conditions, longer-term yields are higher (upward slope). When short-term yields exceed long-term yields, the curve "inverts."',
    note: 'Every US recession since 1955 was preceded by a yield curve inversion. Watch the 2s10s spread — when it goes negative, markets smell trouble.',
  },
  {
    icon: '🔢',
    tag: 'RIGHT PANEL — BOTTOM',
    tagColor: 'var(--g-txt-2)',
    title: 'Your macro watchlist.',
    body: 'Six key indicators update every meeting: Core Inflation, Unemployment, GDP Growth, Fed Funds Rate, 10Y Treasury Yield, and VIX. Green = moving in the right direction. Red = wrong direction.',
    note: 'Hover any metric on the left sidebar for a deep explanation of what it means, where it should be, and why it matters.',
  },
  {
    icon: '🎛',
    tag: 'BOTTOM BAR',
    tagColor: 'var(--g-brand)',
    title: 'Five tools. One per meeting.',
    points: [
      { label: 'Raise +25bps', color: 'var(--g-down)', desc: 'Cools inflation. Risks slowing growth and raising unemployment.' },
      { label: 'Cut −25bps',   color: 'var(--g-up)',   desc: 'Stimulates growth. Risks reigniting inflation.' },
      { label: 'Hold',         color: 'var(--g-txt-3)', desc: 'Signals patience. Sometimes the right call — don\'t mistake inaction for weakness.' },
      { label: 'QE',           color: 'var(--g-info)',  desc: 'Emergency liquidity — buy bonds to flood the system. Reserve for crises.' },
      { label: 'QT',           color: 'var(--g-warn)',  desc: 'Drain the balance sheet. Slow-acting but powerful tightening.' },
    ],
  },
  {
    icon: '📋',
    tag: 'AFTER EACH DECISION',
    tagColor: 'var(--g-warn)',
    title: 'The aftermath.',
    body: 'Every decision triggers a Turn Card showing market reaction, economic impact, and a historical parallel. You can also hold a Press Conference — answer questions from reporters, Powell-style.',
    note: 'The Taylor Rule panel on the left calculates what a mechanical rule would recommend. If your rate deviates far from it, you\'d better have a good reason.',
  },
  {
    icon: '🚀',
    tag: 'READY',
    tagColor: 'var(--g-up)',
    title: 'Fed Chair 101 is loaded.',
    body: 'You\'re starting in a relatively stable economy — inflation slightly above target, full employment, modest growth. The committee has a recommendation. Follow it to learn the basics, or override it if you see something they don\'t.',
    note: 'You have 30 meetings. Your score is based on how well you maintain the dual mandate. Good luck, Chair.',
  },
]

type Props = { onDismiss: () => void }

export function OnboardingModal({ onDismiss }: Props) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onDismiss} />

      <motion.div
        key={step}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md mx-4 rounded-sm overflow-hidden"
        style={{ background: 'var(--g-surface)', border: '1px solid var(--g-border-bright)', boxShadow: '0 32px 80px rgba(0,0,0,0.9)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="h-0.5 w-full" style={{ background: 'var(--g-raised)' }}>
          <motion.div
            className="h-full"
            style={{ background: 'var(--g-brand)' }}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step counter */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="g-label" style={{ color: current.tagColor }}>{current.tag}</span>
          <span className="g-label" style={{ color: 'var(--g-txt-3)' }}>{step + 1} / {STEPS.length}</span>
        </div>

        {/* Icon + Title */}
        <div className="px-5 pb-4 flex items-start gap-4">
          <span className="text-4xl flex-shrink-0 mt-0.5">{current.icon}</span>
          <h2 className="font-black leading-tight" style={{ fontFamily: 'var(--g-font-display)', fontSize: 20, color: 'var(--g-txt-1)' }}>
            {current.title}
          </h2>
        </div>

        {/* Body text */}
        {current.body && (
          <div className="px-5 pb-4">
            <p className="text-xs leading-relaxed" style={{ color: 'var(--g-txt-2)', fontFamily: 'var(--g-font-data)' }}>
              {current.body}
            </p>
          </div>
        )}

        {/* Bullet points */}
        {current.points && (
          <div className="px-5 pb-4 space-y-2">
            {current.points.map(p => (
              <div key={p.label} className="flex items-start gap-2">
                <span className="text-xs font-black flex-shrink-0 mt-0.5 w-28"
                  style={{ color: p.color, fontFamily: 'var(--g-font-data)' }}>
                  {p.label}
                </span>
                <span className="text-xs leading-relaxed" style={{ color: 'var(--g-txt-2)', fontFamily: 'var(--g-font-data)' }}>
                  {p.desc}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Note callout */}
        {current.note && (
          <div className="mx-5 mb-4 px-3 py-2 rounded-sm"
            style={{ background: 'rgba(41,98,255,0.06)', borderLeft: '2px solid var(--g-brand)' }}>
            <p className="text-[11px] leading-relaxed italic" style={{ color: 'var(--g-txt-3)', fontFamily: 'var(--g-font-data)' }}>
              {current.note}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="px-5 pb-5 flex items-center justify-between gap-3"
          style={{ borderTop: '1px solid var(--g-border)', paddingTop: 16 }}>
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="py-2 px-4 rounded-sm text-xs font-bold transition-all disabled:opacity-30"
            style={{ background: 'var(--g-raised)', border: '1px solid var(--g-border)', color: 'var(--g-txt-2)', fontFamily: 'var(--g-font-data)' }}
          >
            ← Back
          </button>

          <button onClick={onDismiss} className="g-label hover:underline transition-colors">
            Skip tour
          </button>

          {isLast ? (
            <button
              onClick={onDismiss}
              className="py-2 px-5 rounded-sm text-xs font-black transition-all hover:brightness-110"
              style={{ background: 'var(--g-brand)', color: 'white', fontFamily: 'var(--g-font-display)' }}
            >
              Start Playing →
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className="py-2 px-5 rounded-sm text-xs font-black transition-all hover:brightness-110"
              style={{ background: 'var(--g-brand)', color: 'white', fontFamily: 'var(--g-font-display)' }}
            >
              Next →
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

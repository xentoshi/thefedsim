'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const STATS = [
  { label: 'SCENARIOS', value: '12' },
  { label: 'POLICY TOOLS', value: '5' },
  { label: 'FOMC MEMBERS', value: '12' },
  { label: '$FED REWARDS', value: 'LIVE' },
]

const TICKER = [
  'CPI YoY +3.2%', 'FED FUNDS 5.25–5.50%', '10Y YIELD 4.38%',
  'SPX 5,234.18', 'UNEMPLOYMENT 3.9%', 'GDP +2.4%', 'VIX 14.8',
  'BTC $67,240', 'CORE PCE +2.8%', 'M2 MONEY SUPPLY $21.1T',
]

export default function LandingPage() {

  return (
    <main className="relative min-h-screen bg-[#060608] overflow-hidden flex flex-col items-center justify-center">

      {/* Animated grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,105,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,105,0,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glow center */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,105,0,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Scanlines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-[10px] font-mono tracking-[0.3em] uppercase text-[#ff6900] border border-[#ff6900]/30 rounded-sm px-3 py-1 bg-[#ff6900]/5"
        >
          Federal Reserve Monetary Policy Simulation
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl sm:text-8xl font-black uppercase tracking-tight mb-2 leading-none"
          style={{
            fontFamily: "'Orbitron', 'Space Mono', monospace",
            background: 'linear-gradient(135deg, #ffffff 30%, #ff6900 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
          }}
        >
          The Fed
        </motion.h1>
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl sm:text-7xl font-black uppercase tracking-tight mb-8 leading-none"
          style={{
            fontFamily: "'Orbitron', 'Space Mono', monospace",
            background: 'linear-gradient(135deg, #ff6900 0%, #ffaa44 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Simulator
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-[#a1a1aa] text-base sm:text-lg font-mono max-w-xl mb-4 leading-relaxed"
        >
          You are the Chair. Inflation is rising. Markets are watching.
          Every decision moves the economy. Earn $FED for good policy.
        </motion.p>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center gap-6 mb-10"
        >
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-xl font-black font-mono text-white">{s.value}</div>
              <div className="text-[9px] font-mono tracking-widest text-[#71717a] uppercase">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Link href="/fedsim">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="relative group px-10 py-4 text-base font-black uppercase tracking-[0.2em] rounded-sm overflow-hidden"
              style={{ fontFamily: "'Orbitron', monospace" }}
            >
              {/* Button glow */}
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'radial-gradient(ellipse at center, rgba(255,105,0,0.3) 0%, transparent 70%)' }}
              />
              {/* Button border */}
              <span
                className="absolute inset-0 rounded-sm"
                style={{ border: '1px solid rgba(255,105,0,0.6)' }}
              />
              {/* Button fill */}
              <span
                className="absolute inset-0 rounded-sm transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, rgba(255,105,0,0.15) 0%, rgba(255,105,0,0.05) 100%)' }}
              />
              <span className="relative text-white">
                Enter Simulation
              </span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Keyboard hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-4 text-[11px] font-mono text-[#3f3f46] tracking-wider"
        >
          Use F1–F5 to execute policy · Keyboard shortcuts enabled
        </motion.p>
      </div>

      {/* Bottom ticker */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#0d0d10] border-t border-[#1f1f22] overflow-hidden flex items-center">
        <div className="flex-shrink-0 px-3 bg-[#ff6900] h-full flex items-center">
          <span className="text-[9px] font-black font-mono tracking-widest text-black uppercase">LIVE</span>
        </div>
        <motion.div
          className="flex items-center gap-8 font-mono text-[11px] text-[#71717a] whitespace-nowrap px-4"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="text-[#3f3f46]">◆</span>
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </main>
  )
}

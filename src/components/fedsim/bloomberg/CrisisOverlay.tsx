// src/components/fedsim/bloomberg/CrisisOverlay.tsx
// Economic stress overlay with vignette, screen shake, and desaturation

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CrisisLevel } from '@/engine/types'

type CrisisOverlayProps = {
  level: CrisisLevel
  showShake?: boolean
}

export function CrisisOverlay({ level, showShake = true }: CrisisOverlayProps) {
  const [isShaking, setIsShaking] = useState(false)

  useEffect(() => {
    if (level === 'emergency' && showShake) {
      setIsShaking(true)
      const timeout = setTimeout(() => setIsShaking(false), 500)
      return () => clearTimeout(timeout)
    }
  }, [level, showShake])

  // Apply shake to body
  useEffect(() => {
    if (isShaking) {
      document.body.classList.add('bb-crisis-shake')
    } else {
      document.body.classList.remove('bb-crisis-shake')
    }
    return () => document.body.classList.remove('bb-crisis-shake')
  }, [isShaking])

  // Apply desaturation based on crisis level
  useEffect(() => {
    if (level === 'critical' || level === 'emergency') {
      document.body.classList.add('bb-crisis-desaturate')
    } else {
      document.body.classList.remove('bb-crisis-desaturate')
    }
    return () => document.body.classList.remove('bb-crisis-desaturate')
  }, [level])

  const getVignetteClass = () => {
    switch (level) {
      case 'warning':
        return 'bb-crisis-warning'
      case 'critical':
        return 'bb-crisis-critical'
      case 'emergency':
        return 'bb-crisis-emergency'
      default:
        return ''
    }
  }

  return (
    <AnimatePresence>
      {level !== 'none' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`bb-crisis-vignette ${getVignetteClass()}`}
        />
      )}
    </AnimatePresence>
  )
}

// Helper function to determine crisis level from game state
export function calculateCrisisLevel(state: {
  macro: { coreInflation: number; unemploymentRate: number; gdpGrowth: number }
  financial: { spxVolatility: number; fci: number }
  credibility: { overallScore: number }
}): CrisisLevel {
  const { macro, financial, credibility } = state

  // Emergency conditions
  if (
    macro.coreInflation > 10 ||
    macro.unemploymentRate > 12 ||
    macro.gdpGrowth < -3 ||
    financial.spxVolatility > 50 ||
    credibility.overallScore < 20
  ) {
    return 'emergency'
  }

  // Critical conditions
  if (
    macro.coreInflation > 7 ||
    macro.unemploymentRate > 9 ||
    macro.gdpGrowth < -1 ||
    financial.spxVolatility > 40 ||
    credibility.overallScore < 40
  ) {
    return 'critical'
  }

  // Warning conditions
  if (
    macro.coreInflation > 5 ||
    macro.unemploymentRate > 7 ||
    macro.gdpGrowth < 0.5 ||
    financial.spxVolatility > 30 ||
    credibility.overallScore < 60
  ) {
    return 'warning'
  }

  return 'none'
}

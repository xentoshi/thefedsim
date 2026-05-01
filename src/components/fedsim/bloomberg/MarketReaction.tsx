// src/components/fedsim/bloomberg/MarketReaction.tsx
// Visual ripple effect when player takes action

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SimplePolicyAction } from '@/engine/types'

type MarketReactionProps = {
  lastAction: SimplePolicyAction | null
  timestamp: number
}

type ReactionConfig = {
  color: string
  label: string
  icon: string
  description: string
}

const reactionConfigs: Record<SimplePolicyAction, ReactionConfig> = {
  raise: {
    color: 'bg-red-500',
    label: 'RATE HIKE',
    icon: '📈',
    description: 'Tightening monetary policy',
  },
  cut: {
    color: 'bg-green-500',
    label: 'RATE CUT',
    icon: '📉',
    description: 'Easing monetary policy',
  },
  hold: {
    color: 'bg-zinc-500',
    label: 'RATES HELD',
    icon: '⏸️',
    description: 'Maintaining current stance',
  },
  qe: {
    color: 'bg-blue-500',
    label: 'QE INITIATED',
    icon: '💵',
    description: 'Expanding balance sheet',
  },
  qt: {
    color: 'bg-orange-500',
    label: 'QT INITIATED',
    icon: '📊',
    description: 'Shrinking balance sheet',
  },
}

export function MarketReaction({ lastAction, timestamp }: MarketReactionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (lastAction) {
      setKey((prev) => prev + 1)
      setIsVisible(true)
      const timeout = setTimeout(() => setIsVisible(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [lastAction, timestamp])

  if (!lastAction) return null

  const config = reactionConfigs[lastAction]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={key}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div
            className={`
              ${config.color} text-white px-6 py-4 rounded-lg shadow-2xl
              flex items-center gap-4
            `}
          >
            {/* Ripple effect */}
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`absolute inset-0 ${config.color} rounded-lg`}
            />

            <span className="text-3xl relative z-10">{config.icon}</span>
            <div className="relative z-10">
              <div className="font-bold text-lg">{config.label}</div>
              <div className="text-sm opacity-80">{config.description}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Subtle background pulse on action
export function BackgroundPulse({
  trigger,
  color = 'blue',
}: {
  trigger: number
  color?: 'red' | 'green' | 'blue' | 'orange' | 'zinc'
}) {
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (trigger > 0) {
      setKey((prev) => prev + 1)
    }
  }, [trigger])

  const colorMap = {
    red: 'bg-red-500/20',
    green: 'bg-green-500/20',
    blue: 'bg-blue-500/20',
    orange: 'bg-orange-500/20',
    zinc: 'bg-zinc-500/20',
  }

  return (
    <AnimatePresence>
      {trigger > 0 && (
        <motion.div
          key={key}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`fixed inset-0 ${colorMap[color]} pointer-events-none z-30`}
        />
      )}
    </AnimatePresence>
  )
}

// src/components/fedsim/bloomberg/ObjectiveTracker.tsx
// Gamified checklist with animated checkmarks and $FED earned

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { GameState } from '@/engine/types'

type Objective = {
  description: string
  condition: (state: GameState) => boolean
  weight: number
}

type ObjectiveTrackerProps = {
  objectives: Objective[]
  state: GameState
  fedPerObjective?: number
}

export function ObjectiveTracker({
  objectives,
  state,
  fedPerObjective = 100,
}: ObjectiveTrackerProps) {
  const completedCount = objectives.filter((obj) => obj.condition(state)).length
  const totalFedEarned = completedCount * fedPerObjective
  const progress = (completedCount / objectives.length) * 100

  return (
    <div className="bb-panel overflow-hidden">
      <div className="bb-panel-header flex items-center justify-between">
        <span>OBJECTIVES</span>
        <span className="text-[var(--bb-orange)]">
          ${totalFedEarned} <span className="opacity-70">$FED</span>
        </span>
      </div>

      <div className="p-3 space-y-2">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-[var(--bb-text-muted)]">PROGRESS</span>
            <span className="text-[var(--bb-text-primary)]">
              {completedCount}/{objectives.length}
            </span>
          </div>
          <div className="h-1.5 bg-[var(--bb-dark)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-[var(--bb-metric-up)] rounded-full"
            />
          </div>
        </div>

        {/* Objective list */}
        <div className="space-y-2">
          <AnimatePresence>
            {objectives.map((obj, i) => {
              const isComplete = obj.condition(state)
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`
                    flex items-start gap-2 p-2 rounded text-sm
                    transition-all duration-300
                    ${
                      isComplete
                        ? 'bg-[var(--bb-metric-up)]/10 text-[var(--bb-metric-up)]'
                        : 'bg-[var(--bb-dark)] text-[var(--bb-text-secondary)]'
                    }
                  `}
                >
                  <motion.span
                    initial={false}
                    animate={{
                      scale: isComplete ? [1, 1.3, 1] : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0 mt-0.5"
                  >
                    {isComplete ? (
                      <span className="text-[var(--bb-metric-up)]">✓</span>
                    ) : (
                      <span className="text-[var(--bb-text-muted)]">○</span>
                    )}
                  </motion.span>
                  <span
                    className={isComplete ? 'line-through opacity-70' : ''}
                  >
                    {obj.description}
                  </span>
                  {isComplete && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="ml-auto text-[10px] text-[var(--bb-orange)]"
                    >
                      +{fedPerObjective}
                    </motion.span>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// src/components/fedsim/bloomberg/MetricCard.tsx
// Dense metric display with animated number, threshold coloring, and pulse on critical

'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { AnimatedNumber } from './AnimatedNumber'

type MetricCardProps = {
  label: string
  value: number
  format?: 'percent' | 'number' | 'billions' | 'currency'
  decimals?: number
  target?: number
  warningThreshold?: number
  dangerThreshold?: number
  inverse?: boolean
  showSparkline?: boolean
  history?: number[]
  compact?: boolean
}

export function MetricCard({
  label,
  value,
  format = 'percent',
  decimals = 1,
  target,
  warningThreshold,
  dangerThreshold,
  inverse = false,
  showSparkline = false,
  history = [],
  compact = false,
}: MetricCardProps) {
  // Determine status based on thresholds
  const status = useMemo(() => {
    if (dangerThreshold !== undefined) {
      const inDanger = inverse ? value < dangerThreshold : value > dangerThreshold
      if (inDanger) return 'danger'
    }
    if (warningThreshold !== undefined) {
      const inWarning = inverse ? value < warningThreshold : value > warningThreshold
      if (inWarning) return 'warning'
    }
    return 'normal'
  }, [value, warningThreshold, dangerThreshold, inverse])

  const getStatusColor = () => {
    switch (status) {
      case 'danger':
        return 'border-[var(--bb-metric-danger)]'
      case 'warning':
        return 'border-[var(--bb-metric-warning)]'
      default:
        return 'border-[var(--bb-border)]'
    }
  }

  const getValueColor = () => {
    switch (status) {
      case 'danger':
        return 'text-[var(--bb-metric-danger)]'
      case 'warning':
        return 'text-[var(--bb-metric-warning)]'
      default:
        return 'text-[var(--bb-metric-up)]'
    }
  }

  // Mini sparkline SVG
  const renderSparkline = () => {
    if (!showSparkline || history.length < 2) return null

    const width = 60
    const height = 20
    const data = history.slice(-10) // Last 10 points
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const points = data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * width
        const y = height - ((v - min) / range) * height
        return `${x},${y}`
      })
      .join(' ')

    return (
      <svg width={width} height={height} className="opacity-50">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          points={points}
          className={getValueColor()}
        />
      </svg>
    )
  }

  if (compact) {
    return (
      <div
        className={`
          flex items-center justify-between px-3 py-2
          border-l-2 ${getStatusColor()}
          bg-[var(--bb-dark)]
        `}
      >
        <span className="text-[10px] uppercase tracking-wider text-[var(--bb-text-muted)]">
          {label}
        </span>
        <span className={`font-mono font-bold ${getValueColor()}`}>
          {format === 'percent'
            ? `${value.toFixed(decimals)}%`
            : format === 'billions'
              ? value >= 1000
                ? `$${(value / 1000).toFixed(1)}T`
                : `$${value.toFixed(0)}B`
              : value.toFixed(decimals)}
        </span>
      </div>
    )
  }

  return (
    <motion.div
      className={`
        bb-panel p-3 transition-all duration-300
        border-l-2 ${getStatusColor()}
        ${status === 'danger' ? 'bb-animate-border-pulse' : ''}
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[var(--bb-text-muted)] mb-1">
            {label}
          </span>
          <AnimatedNumber
            value={value}
            format={format}
            decimals={decimals}
            size="lg"
            showDirection={false}
            className={getValueColor()}
          />
          {target !== undefined && (
            <span className="text-[10px] text-[var(--bb-text-muted)] mt-1">
              Target: {target}%
            </span>
          )}
        </div>
        {renderSparkline()}
      </div>
    </motion.div>
  )
}

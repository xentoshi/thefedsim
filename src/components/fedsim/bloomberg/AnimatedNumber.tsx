// src/components/fedsim/bloomberg/AnimatedNumber.tsx
// Animated number counter with color flash on change

'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

type AnimatedNumberProps = {
  value: number
  format?: 'percent' | 'number' | 'billions' | 'currency'
  decimals?: number
  duration?: number
  showDirection?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function AnimatedNumber({
  value,
  format = 'number',
  decimals = 1,
  duration = 0.6,
  showDirection = true,
  className = '',
  size = 'md',
}: AnimatedNumberProps) {
  const prevValue = useRef(value)
  const [direction, setDirection] = useState<'up' | 'down' | 'none'>('none')
  const [isFlashing, setIsFlashing] = useState(false)

  // Spring animation for smooth number transitions
  const spring = useSpring(value, {
    stiffness: 100,
    damping: 20,
    duration: duration * 1000,
  })

  // Transform to formatted display string
  const displayValue = useTransform(spring, (latest) => {
    switch (format) {
      case 'percent':
        return `${latest.toFixed(decimals)}%`
      case 'billions':
        if (latest >= 1000) {
          return `$${(latest / 1000).toFixed(1)}T`
        }
        return `$${latest.toFixed(0)}B`
      case 'currency':
        return `$${latest.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      default:
        return latest.toFixed(decimals)
    }
  })

  // Track direction changes
  useEffect(() => {
    if (value !== prevValue.current) {
      const newDirection = value > prevValue.current ? 'up' : 'down'
      setDirection(newDirection)
      setIsFlashing(true)
      spring.set(value)

      // Reset flash after animation
      const timeout = setTimeout(() => {
        setIsFlashing(false)
      }, 300)

      prevValue.current = value
      return () => clearTimeout(timeout)
    }
  }, [value, spring])

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl',
  }

  const getDirectionColor = () => {
    if (!showDirection || direction === 'none') return 'text-white'
    return direction === 'up' ? 'text-[var(--bb-metric-up)]' : 'text-[var(--bb-metric-down)]'
  }

  const getFlashClass = () => {
    if (!isFlashing) return ''
    return direction === 'up' ? 'bb-animate-flash-up' : 'bb-animate-flash-down'
  }

  return (
    <motion.span
      className={`
        bb-number font-mono font-bold
        ${sizeClasses[size]}
        ${getDirectionColor()}
        ${getFlashClass()}
        ${className}
      `}
    >
      <motion.span>{displayValue}</motion.span>
      {showDirection && direction !== 'none' && (
        <span className="ml-1 text-xs">
          {direction === 'up' ? '▲' : '▼'}
        </span>
      )}
    </motion.span>
  )
}

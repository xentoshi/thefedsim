// src/components/fedsim/bloomberg/AlertBanner.tsx
// Breaking news/event alerts with slide-in animation

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Alert, AlertSeverity } from '@/engine/types'

type AlertBannerProps = {
  alerts: Alert[]
  onDismiss: (id: string) => void
  maxVisible?: number
}

function getSeverityStyles(severity: AlertSeverity) {
  switch (severity) {
    case 'breaking':
      return {
        bg: 'bg-[var(--bb-red)]',
        border: 'border-[var(--bb-red)]',
        text: 'text-white',
        icon: '🔴',
        label: 'BREAKING',
      }
    case 'critical':
      return {
        bg: 'bg-[var(--bb-metric-danger)]/20',
        border: 'border-[var(--bb-metric-danger)]',
        text: 'text-[var(--bb-metric-danger)]',
        icon: '⚠️',
        label: 'ALERT',
      }
    case 'warning':
      return {
        bg: 'bg-[var(--bb-metric-warning)]/20',
        border: 'border-[var(--bb-metric-warning)]',
        text: 'text-[var(--bb-metric-warning)]',
        icon: '⚡',
        label: 'WARNING',
      }
    default:
      return {
        bg: 'bg-[var(--bb-blue)]/20',
        border: 'border-[var(--bb-blue)]',
        text: 'text-[var(--bb-blue)]',
        icon: 'ℹ️',
        label: 'INFO',
      }
  }
}

function AlertItem({
  alert,
  onDismiss,
}: {
  alert: Alert
  onDismiss: (id: string) => void
}) {
  const styles = getSeverityStyles(alert.severity)

  useEffect(() => {
    if (alert.autoDismiss) {
      const timeout = setTimeout(() => {
        onDismiss(alert.id)
      }, alert.duration || 5000)
      return () => clearTimeout(timeout)
    }
  }, [alert, onDismiss])

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className={`
        ${styles.bg} ${styles.border} ${styles.text}
        border-l-2 px-3 py-1.5 rounded-sm
        flex items-center justify-between gap-3
        shadow-lg backdrop-blur-sm text-xs
        ${alert.severity === 'breaking' || alert.severity === 'critical' ? 'bb-animate-pulse' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        <span>{styles.icon}</span>
        <span className="font-bold opacity-60 tracking-wider">{styles.label}</span>
        <span className="font-mono">{alert.message}</span>
      </div>
      <button
        onClick={() => onDismiss(alert.id)}
        className="text-current opacity-50 hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </motion.div>
  )
}

export function AlertBanner({ alerts, onDismiss, maxVisible = 3 }: AlertBannerProps) {
  const visibleAlerts = alerts.slice(0, maxVisible)

  return (
    <div className="fixed top-10 left-56 right-80 z-50 p-2 space-y-1 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {visibleAlerts.map((alert) => (
          <div key={alert.id} className="pointer-events-auto">
            <AlertItem alert={alert} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Hook for managing alerts
export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])

  const addAlert = (alert: Omit<Alert, 'id' | 'timestamp'>) => {
    const newAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    }
    setAlerts((prev) => [newAlert, ...prev])
    return newAlert.id
  }

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  const clearAlerts = () => {
    setAlerts([])
  }

  return {
    alerts,
    addAlert,
    dismissAlert,
    clearAlerts,
  }
}

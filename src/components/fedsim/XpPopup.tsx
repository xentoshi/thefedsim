'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

type Popup = { id: number; text: string; color: string }

type Props = {
  scoreDelta: number
  streak: number
  trigger: number   // increment to fire
}

export function XpPopup({ scoreDelta, streak, trigger }: Props) {
  const [popups, setPopups] = useState<Popup[]>([])

  useEffect(() => {
    if (trigger === 0) return

    const items: Popup[] = []
    const base = Date.now()

    if (Math.abs(scoreDelta) > 0.05) {
      items.push({
        id: base,
        text: `${scoreDelta >= 0 ? '+' : ''}${scoreDelta.toFixed(1)} pts`,
        color: scoreDelta >= 0 ? '#10b981' : '#ef4444',
      })
    }

    if (streak >= 3) {
      items.push({
        id: base + 1,
        text: `🔥 ${streak} streak`,
        color: '#ff6900',
      })
    }

    if (items.length === 0) return

    setPopups((prev) => [...prev, ...items])
    const timeout = setTimeout(() => {
      setPopups((prev) => prev.filter((p) => !items.find((i) => i.id === p.id)))
    }, 1400)
    return () => clearTimeout(timeout)
  }, [trigger])    // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed bottom-24 right-6 z-50 pointer-events-none flex flex-col items-end gap-1">
      <AnimatePresence>
        {popups.map((popup) => (
          <motion.div
            key={popup.id}
            initial={{ opacity: 0, y: 0, scale: 0.7 }}
            animate={{ opacity: 1, y: -32, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.8 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-base font-black font-mono px-3 py-1 rounded-sm"
            style={{
              color: popup.color,
              fontFamily: "'Orbitron', monospace",
              textShadow: `0 0 12px ${popup.color}`,
            }}
          >
            {popup.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

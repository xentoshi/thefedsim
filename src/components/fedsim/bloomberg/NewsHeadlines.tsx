'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { NewsItem } from '@/engine/types'

const CATEGORY_ICON: Record<NewsItem['category'], string> = {
  fed: '🏛', economy: '📊', markets: '📈', politics: '🗳', global: '🌍',
}

function sentimentBorder(s: NewsItem['sentiment']) {
  return s === 'positive' ? 'var(--g-up)' : s === 'negative' ? 'var(--g-down)' : 'var(--g-border)'
}

function relativeTime(date: Date): string {
  const m = Math.floor((Date.now() - date.getTime()) / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function NewsHeadlines({ headlines, maxItems = 5 }: { headlines: NewsItem[]; maxItems?: number }) {
  const visible = headlines.slice(0, maxItems)

  return (
    <div className="g-panel overflow-hidden">
      <div className="g-panel-header">Headlines</div>

      <AnimatePresence mode="popLayout">
        {visible.length === 0 ? (
          <div className="px-3 py-4 text-center g-caption">Awaiting market developments...</div>
        ) : visible.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-start gap-2 px-3 py-2"
            style={{
              borderLeft: `2px solid ${sentimentBorder(item.sentiment)}`,
              borderBottom: '1px solid var(--g-border)',
            }}
          >
            <span className="text-sm flex-shrink-0 mt-0.5">{CATEGORY_ICON[item.category] ?? '📰'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-snug mb-0.5" style={{ color: 'var(--g-txt-1)', fontFamily: 'var(--g-font-data)' }}>
                {item.headline}
              </p>
              <p className="g-label">{relativeTime(item.timestamp)}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {headlines.length > maxItems && (
        <div className="px-3 py-2 text-center" style={{ borderTop: '1px solid var(--g-border)' }}>
          <span className="g-label">+{headlines.length - maxItems} more headlines</span>
        </div>
      )}
    </div>
  )
}

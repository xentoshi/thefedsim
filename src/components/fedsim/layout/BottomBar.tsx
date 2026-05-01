// src/components/fedsim/layout/BottomBar.tsx
// Bottom command controls wrapper

'use client'

import { CommandBar } from '../bloomberg'
import type { FomcVote } from '@/engine/types'

type BottomBarProps = {
  onRaise: () => void
  onCut: () => void
  onHold: () => void
  onQE: () => void
  onQT: () => void
  disabled?: boolean
  recommendation?: FomcVote | null
  fedEarned?: number
}

export function BottomBar(props: BottomBarProps) {
  return <CommandBar {...props} />
}

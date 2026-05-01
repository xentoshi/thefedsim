'use client'

import { motion } from 'framer-motion'
import type { FomcMember, FomcVote } from '@/engine/types'

function voteColor(vote?: FomcVote) {
  if (!vote || vote === 'hold') return 'var(--g-txt-3)'
  return vote === 'raise' || vote === 'qt' ? 'var(--g-down)' : 'var(--g-up)'
}
function voteBg(vote?: FomcVote) {
  if (!vote || vote === 'hold') return 'rgba(82,82,91,0.12)'
  return vote === 'raise' || vote === 'qt' ? 'rgba(239,68,68,0.1)' : 'rgba(0,194,106,0.1)'
}
function voteLabel(vote?: FomcVote) {
  return ({ raise:'RAISE', cut:'CUT', qe:'QE', qt:'QT' } as Record<string,string>)[vote ?? ''] ?? 'HOLD'
}
function biasColor(b: FomcMember['bias']) {
  return b === 'hawk' ? 'var(--g-down)' : b === 'dove' ? 'var(--g-up)' : 'var(--g-txt-3)'
}
function avatarGrad(id: string) {
  const h = id.split('').reduce((a,c) => a + c.charCodeAt(0), 0) % 360
  return `linear-gradient(135deg,hsl(${h},55%,32%),hsl(${(h+40)%360},55%,22%))`
}
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)
}

type CardProps = { member: FomcMember; vote?: FomcVote; isDissenter?: boolean; compact?: boolean }

export function FomcMemberCard({ member, vote, isDissenter = false, compact = false }: CardProps) {
  if (compact) {
    return (
      <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}
        className="flex items-center justify-between px-2 py-1.5 rounded-sm"
        style={{
          background: isDissenter ? 'rgba(249,115,22,0.08)' : 'var(--g-raised)',
          border: `1px solid ${isDissenter ? 'rgba(249,115,22,0.25)' : 'var(--g-border)'}`,
        }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white flex-shrink-0"
            style={{ background: avatarGrad(member.id) }}>
            {initials(member.name)}
          </div>
          <span className="g-caption text-xs truncate" style={{ color: isDissenter ? 'var(--g-warn)' : 'var(--g-txt-2)' }}>
            {member.name.split(' ').pop()}
          </span>
        </div>
        <span className="g-label px-1.5 py-0.5 rounded-sm" style={{ color: voteColor(vote), background: voteBg(vote) }}>
          {voteLabel(vote)}
        </span>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      className="g-panel p-3 relative"
      style={{ borderColor: isDissenter ? 'rgba(249,115,22,0.4)' : undefined }}>
      {isDissenter && (
        <motion.span initial={{ scale:0 }} animate={{ scale:1 }}
          className="absolute -top-1.5 -right-1.5 g-label px-1.5 py-0.5 rounded-sm"
          style={{ background: 'var(--g-warn)', color: '#000' }}>
          DISSENT
        </motion.span>
      )}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
          style={{ background: avatarGrad(member.id) }}>
          {initials(member.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="g-data text-xs truncate">{member.name}</span>
            <span className="text-xs">{member.bias === 'hawk' ? '🦅' : member.bias === 'dove' ? '🕊️' : '⚖️'}</span>
          </div>
          <span className="g-caption text-xs block truncate mb-1">{member.title}</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: biasColor(member.bias) }} />
            <span className="g-label">{member.bias}</span>
          </div>
        </div>
        {vote && (
          <span className="g-label px-2 py-1 rounded-sm" style={{ color: voteColor(vote), background: voteBg(vote) }}>
            {voteLabel(vote)}
          </span>
        )}
      </div>
    </motion.div>
  )
}

type PanelProps = { members: FomcMember[]; votes: Map<string,FomcVote>; dissenters: string[]; decision?: FomcVote }

export function FomcVotePanel({ members, votes, dissenters, decision }: PanelProps) {
  const counts: Record<string,number> = {}
  votes.forEach(v => { counts[v] = (counts[v] ?? 0) + 1 })

  return (
    <div className="g-panel overflow-hidden">
      <div className="g-panel-header flex items-center justify-between">
        <span>FOMC VOTES</span>
        {decision && <span className="g-label" style={{ color: voteColor(decision) }}>{voteLabel(decision)}</span>}
      </div>
      <div className="px-3 py-2 flex gap-1.5 flex-wrap" style={{ borderBottom: '1px solid var(--g-border)' }}>
        {Object.entries(counts).map(([v,n]) => (
          <span key={v} className="g-label px-2 py-0.5 rounded-sm"
            style={{ color: voteColor(v as FomcVote), background: voteBg(v as FomcVote) }}>
            {voteLabel(v as FomcVote)}: {n}
          </span>
        ))}
      </div>
      <div className="p-2 space-y-1 max-h-52 overflow-y-auto">
        {members.slice(0,7).map(m => (
          <FomcMemberCard key={m.id} member={m} vote={votes.get(m.id)} isDissenter={dissenters.includes(m.id)} compact />
        ))}
      </div>
      {dissenters.length > 0 && (
        <div className="px-3 py-2 text-center" style={{ borderTop: '1px solid var(--g-border)' }}>
          <span className="g-label" style={{ color: 'var(--g-warn)' }}>
            {dissenters.length} dissenting vote{dissenters.length > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )
}

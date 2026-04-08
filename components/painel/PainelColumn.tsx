import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

const COLUMN_ICONS: Record<string, { svg: React.ReactNode; bg: string; border: string; headerBg: string }> = {
  atendimento: {
    bg: 'bg-white/5',
    border: 'border-white/10',
    headerBg: 'bg-white/5',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-200">
        <path d="M12 3C7 3 3 6.6 3 11c0 2 .8 3.8 2.1 5.2L4 21l5-1.5c1 .3 2 .5 3 .5 5 0 9-3.6 9-8s-4-9-9-9z" stroke="currentColor" strokeWidth="1.7" fill="none" />
        <circle cx="8.5" cy="11" r="1.2" fill="currentColor" />
        <circle cx="12" cy="11" r="1.2" fill="currentColor" />
        <circle cx="15.5" cy="11" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
  agendado: {
    bg: 'bg-blue-500/15',
    border: 'border-blue-400/30',
    headerBg: 'bg-blue-500/20 border-blue-400/35',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-100">
        <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path d="M3 9h18" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 2v5M17 2v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8 13h2M12 13h2M8 16h2M12 16h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  preparando: {
    bg: 'bg-violet-500/15',
    border: 'border-violet-400/30',
    headerBg: 'bg-violet-500/20 border-violet-400/35',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-violet-100">
        <path d="M5 17c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M8 17h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M9.5 10.5L12 7l2.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  pronto: {
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-400/30',
    headerBg: 'bg-emerald-500/20 border-emerald-400/35',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-emerald-100">
        <path d="M7 12.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" fill="none" />
      </svg>
    ),
  },
  entregue: {
    bg: 'bg-white/5',
    border: 'border-white/10',
    headerBg: 'bg-white/5',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-200">
        <path d="M12 3l1.5 4h4l-3.2 2.4 1.2 4L12 11l-3.5 2.4 1.2-4L6.5 7h4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
        <path d="M7 16h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M9 19h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  cancelado: {
    bg: 'bg-white/5',
    border: 'border-white/10',
    headerBg: 'bg-white/5',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-200">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    ),
  },
}

interface PainelColumnProps {
  id: string
  title: string
  count: number
  itemIds: string[]
  children: React.ReactNode
}

export function PainelColumn({ id, title, count, itemIds, children }: PainelColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const colIcon = COLUMN_ICONS[id]

  return (
    <div className="w-[82vw] sm:w-[300px] shrink-0 flex flex-col">
      <div className={`flex items-center justify-between mb-2 rounded-2xl border px-3 py-2 ${colIcon?.headerBg ?? 'bg-white/5 border-white/10'}`}>
        <div className="flex items-center gap-2">
          {colIcon && (
            <span className={`flex items-center justify-center w-9 h-9 rounded-xl border ${colIcon.bg} ${colIcon.border}`}>
              {colIcon.svg}
            </span>
          )}
          <span className="text-sm font-semibold text-gray-100">{title}</span>
        </div>
        <span className="text-xs text-gray-400 rounded-full border border-white/10 bg-black/20 px-2.5 py-1">{count}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-2xl border p-2 min-h-[40vh] max-h-[calc(100vh-260px)] overflow-y-auto space-y-3 transition-colors ${isOver ? 'border-fuchsia-400/50 bg-fuchsia-500/5' : 'border-white/10 bg-white/5'}`}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      </div>
    </div>
  )
}

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

const COLUMN_ICONS: Record<string, { svg: React.ReactNode; bg: string; border: string }> = {
  atendimento: {
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 3C7 3 3 6.6 3 11c0 2 .8 3.8 2.1 5.2L4 21l5-1.5c1 .3 2 .5 3 .5 5 0 9-3.6 9-8s-4-9-9-9z" fill="#60a5fa" />
        <circle cx="8.5" cy="11" r="1.2" fill="white" />
        <circle cx="12" cy="11" r="1.2" fill="white" />
        <circle cx="15.5" cy="11" r="1.2" fill="white" />
      </svg>
    ),
  },
  agendado: {
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/30',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="16" rx="3" fill="#a78bfa" />
        <rect x="3" y="5" width="18" height="5" rx="3" fill="#7c3aed" />
        <rect x="7" y="2" width="2" height="5" rx="1" fill="#c4b5fd" />
        <rect x="15" y="2" width="2" height="5" rx="1" fill="#c4b5fd" />
        <rect x="7" y="13" width="3" height="3" rx="1" fill="white" opacity="0.8" />
        <rect x="11" y="13" width="3" height="3" rx="1" fill="white" opacity="0.8" />
      </svg>
    ),
  },
  preparando: {
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="17" rx="8" ry="4" fill="#fbbf24" />
        <path d="M4 17 Q4 9 12 9 Q20 9 20 17" fill="#fde68a" />
        <path d="M10 9 Q10 5 12 4 Q14 5 14 9" fill="#f59e0b" />
        <circle cx="9" cy="14" r="1" fill="#fef3c7" opacity="0.7" />
        <circle cx="13" cy="13" r="1" fill="#fef3c7" opacity="0.7" />
        <circle cx="15" cy="15" r="0.8" fill="#fef3c7" opacity="0.7" />
      </svg>
    ),
  },
  pronto: {
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" fill="#34d399" />
        <path d="M7.5 12.5l3 3 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="17" cy="7" r="3" fill="#fbbf24" />
        <path d="M16 7h2M17 6v2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  entregue: {
    bg: 'bg-pink-500/15',
    border: 'border-pink-500/30',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 3l1.5 4h4l-3.2 2.4 1.2 4L12 11l-3.5 2.4 1.2-4L6.5 7h4z" fill="#f9a8d4" />
        <circle cx="12" cy="16" r="5" fill="#ec4899" />
        <path d="M10 16l1.5 1.5L14.5 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6" cy="6" r="1.5" fill="#f472b6" opacity="0.7" />
        <circle cx="18" cy="9" r="1" fill="#f472b6" opacity="0.7" />
      </svg>
    ),
  },
  cancelado: {
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" fill="#fca5a5" />
        <circle cx="12" cy="12" r="9" stroke="#ef4444" strokeWidth="1.5" fill="none" />
        <path d="M8 8l8 8M16 8l-8 8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
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
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {colIcon && (
            <span className={`flex items-center justify-center w-9 h-9 rounded-xl border ${colIcon.bg} ${colIcon.border}`}>
              {colIcon.svg}
            </span>
          )}
          <span className="text-sm font-semibold text-gray-100">{title}</span>
        </div>
        <span className="text-xs text-gray-400 bg-gray-800 rounded-full px-2 py-0.5">{count}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-lg border p-2 min-h-[40vh] max-h-[calc(100vh-220px)] overflow-y-auto space-y-3 transition-colors ${isOver ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      </div>
    </div>
  )
}

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

interface PainelColumnProps {
  id: string
  title: string
  count: number
  itemIds: string[]
  children: React.ReactNode
}

export function PainelColumn({ id, title, count, itemIds, children }: PainelColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="w-[82vw] sm:w-[300px] shrink-0 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
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

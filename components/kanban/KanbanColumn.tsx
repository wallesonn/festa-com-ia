import React from 'react'

export function KanbanColumn({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="min-w-[280px] w-full lg:w-1/3 xl:w-1/4 2xl:w-1/5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
        {typeof count === 'number' && (
          <span className="text-xs text-gray-400 bg-gray-800 rounded-full px-2 py-0.5">{count}</span>
        )}
      </div>
      <div className="card p-3 h-[70vh] overflow-y-auto space-y-3">
        {children}
      </div>
    </div>
  )
}

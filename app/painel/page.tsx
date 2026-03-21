"use client"

import { useState, useRef } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { PainelCard } from '@/components/painel/PainelCard'
import { PainelColumn } from '@/components/painel/PainelColumn'
import { getOrders } from '@/lib/mockData'
import { Order, PainelStatus } from '@/lib/types'
import { ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react'

const COLUMNS: { key: PainelStatus; title: string }[] = [
  { key: 'atendimento', title: 'Atendimento' },
  { key: 'agendado',    title: 'Agendado' },
  { key: 'preparando',  title: 'Preparando' },
  { key: 'pronto',      title: 'Pronto' },
  { key: 'entregue',    title: 'Entregue' },
  { key: 'cancelado',   title: 'Cancelado' },
]

const STATUS_ORDER: PainelStatus[] = ['atendimento', 'agendado', 'preparando', 'pronto', 'entregue', 'cancelado']

export default function PainelPage() {
  const [orders, setOrders] = useState<Order[]>(getOrders())
  const [activeId, setActiveId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollKanban(direction: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: direction === 'right' ? 300 : -300, behavior: 'smooth' })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  )

  const activeOrder = activeId ? orders.find(o => o.id === activeId) : null

  function handleAdvance(id: string) {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o
      const idx = STATUS_ORDER.indexOf(o.painelStatus)
      const next = STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.indexOf('entregue'))]
      return { ...o, painelStatus: next }
    }))
  }

  function handleCancel(id: string) {
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, painelStatus: 'cancelado' as PainelStatus } : o
    ))
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const activeOrder = orders.find(o => o.id === active.id)
    if (!activeOrder) return

    // Over a column directly
    const overColumn = COLUMNS.find(c => c.key === over.id)
    if (overColumn && activeOrder.painelStatus !== overColumn.key) {
      setOrders(prev => prev.map(o =>
        o.id === active.id ? { ...o, painelStatus: overColumn.key } : o
      ))
      return
    }

    // Over another card — move to that card's column
    const overOrder = orders.find(o => o.id === over.id)
    if (overOrder && activeOrder.painelStatus !== overOrder.painelStatus) {
      setOrders(prev => prev.map(o =>
        o.id === active.id ? { ...o, painelStatus: overOrder.painelStatus } : o
      ))
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over) return

    const activeOrder = orders.find(o => o.id === active.id)
    const overOrder = orders.find(o => o.id === over.id)

    if (!activeOrder) return

    // Reorder within same column
    if (overOrder && activeOrder.painelStatus === overOrder.painelStatus && active.id !== over.id) {
      setOrders(prev => {
        const colItems = prev.filter(o => o.painelStatus === activeOrder.painelStatus)
        const rest = prev.filter(o => o.painelStatus !== activeOrder.painelStatus)
        const oldIdx = colItems.findIndex(o => o.id === active.id)
        const newIdx = colItems.findIndex(o => o.id === over.id)
        return [...rest, ...arrayMove(colItems, oldIdx, newIdx)]
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <h1 className="text-lg font-semibold text-gray-100">Painel</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-rose-500" /> Urgente &lt;2h</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber-400" /> Próximo 2–24h</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> Agendado &gt;24h</span>
        </div>
      </div>

      <div className="relative">
        {/* Seta esquerda */}
        <button
          onClick={() => scrollKanban('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-16 rounded-r-xl bg-gray-900/90 hover:bg-gray-800 active:bg-gray-700 text-gray-100 shadow-xl transition-colors"
          aria-label="Rolar para esquerda"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Seta direita */}
        <button
          onClick={() => scrollKanban('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-16 rounded-l-xl bg-gray-900/90 hover:bg-gray-800 active:bg-gray-700 text-gray-100 shadow-xl transition-colors"
          aria-label="Rolar para direita"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>

        <div ref={scrollRef} className="overflow-x-auto pb-2 select-none px-10" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}>
        <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 pb-4 w-max min-w-full">
          {COLUMNS.map(col => {
            const items = orders.filter(o => o.painelStatus === col.key)
            return (
              <PainelColumn key={col.key} id={col.key} title={col.title} count={items.length} itemIds={items.map(o => o.id)}>
                {items.map(o => (
                  <PainelCard
                    key={o.id}
                    order={o}
                    onAdvance={handleAdvance}
                    onCancel={handleCancel}
                  />
                ))}
              </PainelColumn>
            )
          })}
        </div>

        <DragOverlay>
          {activeOrder ? (
            <div className="opacity-90 rotate-1 scale-105">
              <PainelCard
                order={activeOrder}
                onAdvance={() => {}}
                onCancel={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
        </DndContext>
        </div>
      </div>
    </div>
  )
}

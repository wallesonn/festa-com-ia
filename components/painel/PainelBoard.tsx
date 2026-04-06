"use client"

import { useRef, useState } from 'react'
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
import { PainelCard } from '@/components/painel/PainelCard'
import { PainelColumn } from '@/components/painel/PainelColumn'
import { Order, PainelStatus } from '@/lib/types'
import { ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { previewOrderStatusLocal, queueOrderStatusSync, reorderOrderLocal, useBrowserOrders } from '@/lib/browser/orders-store'

const COLUMNS: { key: PainelStatus; title: string }[] = [
  { key: 'atendimento', title: 'Atendimento' },
  { key: 'agendado',    title: 'Agendado' },
  { key: 'preparando',  title: 'Preparando' },
  { key: 'pronto',      title: 'Pronto' },
  { key: 'entregue',    title: 'Entregue' },
  { key: 'cancelado',   title: 'Cancelado' },
]

const STATUS_ORDER: PainelStatus[] = ['atendimento', 'agendado', 'preparando', 'pronto', 'entregue', 'cancelado']

interface PainelBoardProps {
  initialOrders: Order[]
  professionalId: string
}

export function PainelBoard({ initialOrders, professionalId }: PainelBoardProps) {
  const { orders } = useBrowserOrders(initialOrders, professionalId)
  const [activeId, setActiveId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef<{ id: string; fromStatus: PainelStatus; toStatus: PainelStatus } | null>(null)

  function scrollKanban(direction: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: direction === 'right' ? 300 : -300, behavior: 'smooth' })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  )

  const activeOrder = activeId ? orders.find(o => o.id === activeId) : null

  function handleAdvance(id: string) {
    const order = orders.find(o => o.id === id)
    if (!order) return
    const idx = STATUS_ORDER.indexOf(order.painelStatus)
    const next = STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.indexOf('entregue'))]
    queueOrderStatusSync(id, next)
  }

  function handleCancel(id: string) {
    queueOrderStatusSync(id, 'cancelado')
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
    const order = orders.find(o => o.id === active.id)
    if (order) {
      dragStateRef.current = { id: active.id as string, fromStatus: order.painelStatus, toStatus: order.painelStatus }
    }
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || !dragStateRef.current) return
    const drag = dragStateRef.current

    const overColumnKey = COLUMNS.find(c => c.key === over.id)?.key
    if (overColumnKey) {
      if (overColumnKey !== drag.toStatus) {
        drag.toStatus = overColumnKey
        previewOrderStatusLocal(active.id as string, overColumnKey)
      }
      return
    }

    const overOrder = orders.find(o => o.id === over.id)
    const activeOrder = orders.find(o => o.id === active.id)
    if (!activeOrder || !overOrder) return

    if (activeOrder.painelStatus !== overOrder.painelStatus) {
      drag.toStatus = overOrder.painelStatus
      previewOrderStatusLocal(active.id as string, overOrder.painelStatus)
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const drag = dragStateRef.current
    dragStateRef.current = null
    setActiveId(null)

    if (!over) {
      if (drag) {
        previewOrderStatusLocal(drag.id, drag.fromStatus)
      }
      return
    }

    if (drag && drag.toStatus !== drag.fromStatus) {
      queueOrderStatusSync(drag.id, drag.toStatus)
    }

    reorderOrderLocal(active.id as string, over.id as string)
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-fuchsia-500/20 via-white/5 to-violet-500/15 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_42%)]" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.28em] text-gray-200">
                Gestão de pedidos
              </div>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">Painel</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 px-3 py-1 text-rose-200"><span className="inline-block w-2 h-2 rounded-full bg-rose-500 shrink-0" /> Urgente &lt;2h</span>
              <span className="flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-amber-200"><span className="inline-block w-2 h-2 rounded-full bg-amber-400 shrink-0" /> Próximo 2–24h</span>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-emerald-200"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> Agendado &gt;24h</span>
            </div>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl p-8 sm:p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-3xl">
            📭
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-white">Nenhum pedido ainda</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-300">
            Quando houver pedidos, eles aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={() => scrollKanban('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-16 rounded-r-xl border border-white/10 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-gray-100 shadow-xl transition-colors"
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={() => scrollKanban('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-16 rounded-l-xl border border-white/10 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-gray-100 shadow-xl transition-colors"
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
      )}
    </div>
  )
}

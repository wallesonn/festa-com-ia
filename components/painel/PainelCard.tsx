"use client"

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Order, PainelStatus } from '@/lib/types'
import { urgencyBgClass, fmtDatetime, fmtTimeShort } from '@/lib/utils'
import { generateSuggestions } from '@/lib/mockData'
import { Button } from '@/components/ui/button'
import { AvatarDefault } from '@/components/ui/AvatarDefault'
import { Send, ChevronRight, X, GripVertical } from 'lucide-react'

const STATUS_ORDER: PainelStatus[] = ['atendimento', 'agendado', 'preparando', 'pronto', 'entregue', 'cancelado']

interface PainelCardProps {
  order: Order
  onAdvance: (id: string) => void
  onCancel: (id: string) => void
}

export function PainelCard({ order, onAdvance, onCancel }: PainelCardProps) {
  const [reply, setReply] = useState('')
  const [sent, setSent] = useState(false)
  const suggestions = generateSuggestions(order.lastMessage)
  const bg = urgencyBgClass(order.deliveryDatetime)

  const isLast = order.painelStatus === 'entregue' || order.painelStatus === 'cancelado'
  const isCancelled = order.painelStatus === 'cancelado'

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id, data: { status: order.painelStatus } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  function handleSend() {
    if (!reply.trim()) return
    setSent(true)
    setReply('')
    setTimeout(() => setSent(false), 2000)
  }

  return (
    <div ref={setNodeRef} style={style} className={`rounded-xl border p-3 space-y-2.5 ${bg} ${isDragging ? 'shadow-2xl ring-2 ring-primary' : ''}`}>
      {/* Drag handle + header */}
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing text-white/40 hover:text-white/80 shrink-0 touch-none"
          aria-label="Arrastar card"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <AvatarDefault size={32} className="rounded-full shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-100 truncate leading-tight">{order.clientName}</div>
          <div className="text-xs text-white/60 truncate">{order.productType} · {order.peopleCount} pessoas</div>
        </div>
      </div>

      {/* Entrega */}
      <div className="text-xs text-white/70 font-medium">
        📅 <span className="text-gray-100">{fmtDatetime(order.deliveryDatetime)}</span>
      </div>

      {/* Última mensagem */}
      <div className="border-t border-white/10 pt-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">Última mensagem</span>
          <span className="text-xs text-white/50">{fmtTimeShort(order.lastMessageAt)}</span>
        </div>
        <div className="text-sm text-gray-100 line-clamp-2 leading-snug">{order.lastMessage}</div>
      </div>

      {/* Sugestões */}
      <div className="flex flex-col gap-1">
        {suggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => setReply(sug)}
            className="text-left text-xs px-3 py-2 rounded-lg bg-black/20 active:bg-black/40 text-white/80 truncate transition-colors min-h-[36px]"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Campo de resposta */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          inputMode="text"
          value={reply}
          onChange={e => setReply(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={sent ? 'Enviado!' : 'Responder...'}
          className="flex-1 h-10 rounded-lg border border-white/20 bg-black/20 px-3 text-sm text-gray-100 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleSend}
          aria-label="Enviar"
          className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg bg-primary hover:bg-primary/80 active:bg-primary/60 text-white transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Ações de etapa */}
      {!isCancelled && (
        <div className="flex gap-2 pt-1 border-t border-white/10">
          {!isLast && (
            <button
              onClick={() => onAdvance(order.id)}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold min-h-[40px] rounded-lg bg-white/15 active:bg-white/30 text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
              Avançar
            </button>
          )}
          <button
            onClick={() => onCancel(order.id)}
            className="flex items-center justify-center gap-1 text-xs font-semibold px-3 min-h-[40px] rounded-lg bg-rose-900/60 active:bg-rose-700 text-rose-200 transition-colors"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

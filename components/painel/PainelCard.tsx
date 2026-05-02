"use client"

import { useState, useTransition } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ChatMessage } from '@/lib/types'
import { Order, PainelStatus } from '@/lib/types'
import { urgencyBorderClass, urgencyPulseClass, fmtDatetime, fmtTimeShort } from '@/lib/utils'
import { useConversationPolling } from '@/lib/hooks/useConversationPolling'
import { sendMessage } from '@/app/painel/actions'
import { AvatarDefault } from '@/components/ui/AvatarDefault'
import { Send, ChevronRight, X, GripVertical, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

interface PainelCardProps {
  order: Order
  professionalId: string
  onAdvance: (id: string) => void
  onSchedule: (id: string, targetStatus?: PainelStatus) => void
  onCancel: (id: string) => void
}

export function PainelCard({ order, professionalId, onAdvance, onSchedule, onCancel }: PainelCardProps) {
  const [reply, setReply] = useState('')
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [clientPhotoLoadFailed, setClientPhotoLoadFailed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)
  const [expandedSuggestions, setExpandedSuggestions] = useState(false)
  const [replyOpen, setReplyOpen] = useState(true)

  const { messages: liveMessages, isLoading: isPolling } = useConversationPolling(
    expanded ? (order.conversationId ?? null) : null
  )
  const displayMessages = liveMessages.length > 0 ? liveMessages : order.messages
  const lastClientMsg = [...displayMessages].reverse().find(m => m.sender === 'client')
  const suggestions = lastClientMsg?.suggestions ?? []
  const unreadClientMessagesCount = order.unreadClientMessagesCount ?? countUnreadClientMessages(displayMessages)

  const [productLineRaw, ...productVariationParts] = order.productSubtype.split('·')
  const productLine = productLineRaw?.trim() || 'Sem linha'
  const productVariations = productVariationParts.join('·').trim()
  const statusTone = order.painelStatus === 'pronto'
    ? 'border-l-4 border-emerald-500'
    : order.painelStatus === 'entregue' || order.painelStatus === 'cancelado'
      ? ''
      : `${urgencyBorderClass(order.deliveryDatetime)} ${urgencyPulseClass(order.deliveryDatetime)}`

  const primaryActionLabel =
    order.painelStatus === 'atendimento' ? 'Agendar'
      : order.painelStatus === 'agendado' ? 'Preparar'
        : order.painelStatus === 'preparando' ? 'Finalizar'
          : order.painelStatus === 'pronto' ? 'Entregar'
            : 'Arquivar'

  const primaryActionDisabled = order.painelStatus === 'entregue' || order.painelStatus === 'cancelado'

  function handlePrimaryAction() {
    if (primaryActionDisabled) return
    if (order.painelStatus === 'atendimento') {
      onSchedule(order.id)
      return
    }
    onAdvance(order.id)
  }

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

  const clientPhotoUrl = order.clientPhotoUrl?.trim() || ''
  const showClientPhoto = Boolean(clientPhotoUrl) && !clientPhotoLoadFailed

  function countUnreadClientMessages(messages: ChatMessage[]) {
    let lastAttendantIndex = -1
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.sender === 'attendant') {
        lastAttendantIndex = i
        break
      }
    }

    const unreadMessages = messages.slice(lastAttendantIndex + 1)
    return unreadMessages.filter((message) => message.sender === 'client').length
  }

  function handleSend() {
    const text = reply.trim()
    if (!text || isPending) return
    if (!order.conversationId) {
      setSendError('Pedido sem conversa vinculada')
      setTimeout(() => setSendError(null), 3000)
      return
    }
    setSendError(null)
    startTransition(async () => {
      const result = await sendMessage({
        conversationId: order.conversationId!,
        orderId: order.id,
        professionalId,
        text,
      })
      if (result.ok) {
        setSent(true)
        setReply('')
        setReplyOpen(false)
        setExpandedSuggestions(false)
        setTimeout(() => setSent(false), 2000)
      } else {
        setSendError(result.error ?? 'Erro ao enviar')
        setTimeout(() => setSendError(null), 4000)
      }
    })
  }

  return (
    <div ref={setNodeRef} style={style} className={`rounded-xl border border-white/10 bg-white/5 p-3 space-y-2.5 ${statusTone} ${isDragging ? 'shadow-2xl ring-2 ring-fuchsia-400/50' : ''}`}>
      {/* Drag handle + header */}
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing text-white/40 hover:text-white/80 shrink-0 touch-none"
          aria-label="Arrastar card"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        {showClientPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clientPhotoUrl}
            alt={`Foto de ${order.clientName}`}
            width={64}
            height={64}
            onError={() => setClientPhotoLoadFailed(true)}
            className="h-16 w-16 rounded-full object-cover shrink-0 border border-white/10 bg-white/5"
          />
        ) : (
          <AvatarDefault size={64} className="rounded-full shrink-0" />
        )}
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-start gap-2">
            <div className="font-semibold text-xl sm:text-2xl text-gray-100 leading-tight">{order.clientName}</div>
            {unreadClientMessagesCount > 0 && (
              <span
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white shadow-sm shadow-emerald-500/30"
                title={`${unreadClientMessagesCount} mensagem(ns) do cliente sem resposta`}
                aria-label={`${unreadClientMessagesCount} mensagem(ns) do cliente sem resposta`}
              >
                {unreadClientMessagesCount > 9 ? '9+' : unreadClientMessagesCount}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm sm:text-base leading-tight text-white/80">
            <span className="font-medium">{order.productType}</span>
            <span className="shrink-0 text-white/35">·</span>
            <span className="font-medium">{productLine}</span>
            <span className="shrink-0 text-white/35">·</span>
            <span className="font-medium">{productVariations || 'Sem variações'}</span>
          </div>
        </div>
      </div>

      {/* Entrega */}
      <div className="text-xs text-white/70 font-medium">
        📅 <span className="text-gray-100">{fmtDatetime(order.deliveryDatetime)}</span>
      </div>

      {/* Histórico de mensagens */}
      <div className="border-t border-white/10 pt-2 space-y-1.5">
        {(expanded ? displayMessages.slice(-10) : displayMessages.slice(-1)).map(msg => (
          <div key={msg.id} className={`flex flex-col gap-0.5 ${msg.sender === 'attendant' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] px-2.5 py-1.5 rounded-xl text-xs leading-snug ${msg.sender === 'attendant' ? 'bg-black/40 text-white rounded-br-none' : 'bg-white/15 text-white/90 rounded-bl-none'}`}>
              {msg.text}
            </div>
            <span className="text-[10px] text-white/35">{fmtTimeShort(msg.at)}</span>
          </div>
        ))}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-center gap-1 text-[11px] text-white/50 hover:text-white/80 py-1 transition-colors"
        >
          {expanded
            ? <><ChevronUp className="h-3 w-3" /> Recolher</>
            : isPolling
              ? <><Loader2 className="h-3 w-3 animate-spin" /> Carregando...</>
              : <><ChevronDown className="h-3 w-3" /> Ver conversa ({displayMessages.length} msgs)</>}
        </button>
      </div>

      {/* Sugestões + Campo de resposta */}
      {replyOpen ? (
        <>
          <div className="flex flex-col gap-1">
            {(expandedSuggestions ? suggestions : suggestions.slice(0, 1)).map((sug, i) => (
              <button
                key={i}
                onClick={() => setReply(sug)}
                className="text-left text-xs px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white/90 whitespace-normal transition-colors min-h-[36px]"
              >
                {sug}
              </button>
            ))}
            {suggestions.length > 1 && (
              <button
                onClick={() => setExpandedSuggestions(v => !v)}
                className="w-full flex items-center justify-center gap-1 text-[11px] text-white/50 hover:text-white/80 py-1 transition-colors"
              >
                {expandedSuggestions
                  ? <><ChevronUp className="h-3 w-3" /> Recolher</>
                  : <><ChevronDown className="h-3 w-3" /> +{suggestions.length - 1} sugestões</>}
              </button>
            )}
          </div>

          {sendError && (
            <p className="text-[11px] text-rose-300 px-1">{sendError}</p>
          )}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              inputMode="text"
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Responder..."
              disabled={isPending}
              className="flex-1 h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-gray-100 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isPending}
              aria-label="Enviar"
              className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-500 hover:from-fuchsia-400 hover:to-violet-400 text-white transition-all disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => setReplyOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 py-1 transition-colors"
        >
          {sent ? <><Send className="h-3 w-3 text-emerald-400" /><span className="text-emerald-400">Enviado!</span></> : <><ChevronDown className="h-3 w-3" /> Responder</>}
        </button>
      )}

      {/* Ações de etapa */}
      <div className="flex gap-2 pt-1 border-t border-white/10">
        {order.painelStatus !== 'entregue' && !isCancelled && (
          <button
            onClick={() => onCancel(order.id)}
            className="flex items-center justify-center gap-1 text-xs font-semibold px-3 min-h-[40px] rounded-lg bg-rose-900/60 active:bg-rose-700 text-rose-200 transition-colors"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
        )}
        <button
          onClick={handlePrimaryAction}
          disabled={primaryActionDisabled}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold min-h-[40px] rounded-lg transition-colors ${
            primaryActionDisabled
              ? 'bg-white/10 text-gray-300 cursor-default'
              : 'bg-white text-gray-900 active:bg-white/80'
          }`}
        >
          <ChevronRight className="h-4 w-4" />
          {primaryActionLabel}
        </button>
      </div>
    </div>
  )
}

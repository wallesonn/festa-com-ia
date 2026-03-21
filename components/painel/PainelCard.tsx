"use client"

import { useState } from 'react'
import { Order } from '@/lib/types'
import { urgencyBgClass, fmtDatetime, fmtTimeShort } from '@/lib/utils'
import { generateSuggestions } from '@/lib/mockData'
import { Button } from '@/components/ui/button'
import { AvatarDefault } from '@/components/ui/AvatarDefault'
import { Send } from 'lucide-react'

export function PainelCard({ order }: { order: Order }) {
  const [reply, setReply] = useState('')
  const [sent, setSent] = useState(false)
  const suggestions = generateSuggestions(order.lastMessage)
  const bg = urgencyBgClass(order.deliveryDatetime)

  function handleSend() {
    if (!reply.trim()) return
    setSent(true)
    setReply('')
    setTimeout(() => setSent(false), 2000)
  }

  function handleSuggestion(sug: string) {
    setReply(sug)
  }

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${bg}`}>
      {/* Header */}
      <div className="flex items-start gap-2">
        <AvatarDefault size={36} className="rounded-full shrink-0" />
        <div>
          <div className="font-medium text-sm text-gray-100">{order.clientName}</div>
          <div className="text-xs text-gray-300">{order.productType} · {order.peopleCount} pessoas</div>
        </div>
      </div>

      {/* Entrega */}
      <div className="text-xs text-gray-300">
        Entrega: <span className="font-medium text-gray-100">{fmtDatetime(order.deliveryDatetime)}</span>
      </div>

      {/* Última mensagem */}
      <div className="border-t border-border pt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Última mensagem</span>
          <span className="text-xs text-gray-500">{fmtTimeShort(order.lastMessageAt)}</span>
        </div>
        <div className="text-sm text-gray-200 truncate">{order.lastMessage}</div>
      </div>

      {/* Sugestões */}
      <div className="flex flex-col gap-1">
        {suggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => handleSuggestion(sug)}
            className="text-left text-xs px-2 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-200 truncate transition-colors"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Campo de resposta */}
      <div className="flex gap-2 items-center pt-1">
        <input
          type="text"
          value={reply}
          onChange={e => setReply(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={sent ? 'Enviado!' : 'Responder...'}
          className="flex-1 h-8 rounded-md border border-border bg-gray-900 px-3 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button size="sm" variant="default" onClick={handleSend} aria-label="Enviar">
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

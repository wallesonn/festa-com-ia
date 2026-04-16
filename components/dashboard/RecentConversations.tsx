"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, CheckCheck, AlertCircle } from 'lucide-react'

export type RecentConversationItem = {
  id: string
  clientName: string
  clientPhone: string
  lastMessage: string
  lastMessageAt: string | null
  responded: boolean // true => última mensagem foi do atendente
  unreadCount: number
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function RecentConversations({ items }: { items: RecentConversationItem[] }) {
  const [tab, setTab] = useState<'nao' | 'sim'>('nao')

  const { respondidas, naoRespondidas } = useMemo(() => {
    return {
      respondidas: items.filter(i => i.responded),
      naoRespondidas: items.filter(i => !i.responded),
    }
  }, [items])

  const list = tab === 'nao' ? naoRespondidas : respondidas
  const visible = list.slice(0, 8)

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold text-white">
          <MessageCircle className="h-4 w-4 text-blue-400" /> Conversas recentes
        </div>
        <Link href="/painel" className="text-xs text-gray-400 hover:text-white">Abrir painel →</Link>
      </div>

      <div className="mb-3 flex gap-1 p-1 rounded-xl bg-black/30 border border-white/10">
        <button
          onClick={() => setTab('nao')}
          className={`flex-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 ${
            tab === 'nao' ? 'bg-rose-500/20 text-rose-200 border border-rose-500/30' : 'text-gray-400 hover:text-white'
          }`}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Não respondidas
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500/20 text-[10px] text-rose-200">
            {naoRespondidas.length}
          </span>
        </button>
        <button
          onClick={() => setTab('sim')}
          className={`flex-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 ${
            tab === 'sim' ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' : 'text-gray-400 hover:text-white'
          }`}
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Respondidas
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-[10px] text-emerald-200">
            {respondidas.length}
          </span>
        </button>
      </div>

      <div className="space-y-2">
        {visible.length === 0 && (
          <div className="text-xs text-gray-500 py-6 text-center">
            {tab === 'nao' ? 'Nenhuma conversa pendente 🎉' : 'Nenhuma conversa respondida ainda.'}
          </div>
        )}
        {visible.map(c => (
          <Link
            key={c.id}
            href="/painel"
            className={`flex items-start gap-3 p-2.5 rounded-xl border transition-colors ${
              c.responded
                ? 'bg-white/5 border-white/5 hover:bg-white/10'
                : 'bg-rose-500/5 border-rose-500/15 hover:bg-rose-500/10'
            }`}
          >
            <div className={`mt-0.5 shrink-0 h-2 w-2 rounded-full ${c.responded ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-medium text-gray-100 truncate">{c.clientName}</div>
                <div className="text-[11px] text-gray-500 shrink-0">{formatRelative(c.lastMessageAt)}</div>
              </div>
              <div className="text-[11px] text-gray-400 truncate">{c.lastMessage || '—'}</div>
            </div>
            {!c.responded && c.unreadCount > 0 && (
              <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-rose-500/30 text-[10px] text-rose-100 font-semibold">
                {c.unreadCount}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ActivityItem, ActivityKind } from '@/lib/db/queries'

type TickerItem = { dot: string; text: string; key: string }

const EMPTY_ITEMS: TickerItem[] = [
  { dot: '#6b7280', text: 'Sem atividade nas últimas 2h — tudo tranquilo por aqui ✨', key: 'empty-1' },
]

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  return `${hours}h atrás`
}

function formatCurrency(v: number | null): string {
  if (v == null) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

const KIND_META: Record<ActivityKind, { dot: string; emoji: string; label: (item: ActivityItem) => string }> = {
  order_created: {
    dot: '#f472b6',
    emoji: '🎂',
    label: (i) => `Novo pedido — ${i.client_name ?? 'cliente'}: ${i.title}`,
  },
  order_finalized: {
    dot: '#34d399',
    emoji: '✅',
    label: (i) => `Pedido finalizado — ${i.client_name ?? 'cliente'} (${i.title})`,
  },
  message_inbound: {
    dot: '#60a5fa',
    emoji: '💬',
    label: (i) => `${i.client_name ?? 'cliente'}: "${i.title}"`,
  },
  message_outbound: {
    dot: '#a78bfa',
    emoji: '↩️',
    label: (i) => `Você respondeu ${i.client_name ?? 'cliente'}`,
  },
  payment: {
    dot: '#fbbf24',
    emoji: '💰',
    label: (i) => `${i.client_name ?? 'cliente'} — ${i.title}${i.amount != null ? ` ${formatCurrency(i.amount)}` : ''}`,
  },
}

function mapItems(items: ActivityItem[]): TickerItem[] {
  if (!items.length) return EMPTY_ITEMS
  return items.map((item, idx) => {
    const meta = KIND_META[item.kind]
    const text = `${meta.emoji} ${meta.label(item)} · ${formatRelative(item.at)}`
    return { dot: meta.dot, text, key: `${item.kind}-${item.at}-${idx}` }
  })
}

export function ActivityTicker({ initialItems = [] }: { initialItems?: ActivityItem[] }) {
  const [items, setItems] = useState<ActivityItem[]>(initialItems)
  const trackRef = useRef<HTMLDivElement>(null)
  const [translatePx, setTranslatePx] = useState(0)

  const tickerItems = useMemo(() => mapItems(items), [items])

  // Polling a cada 30s
  useEffect(() => {
    let active = true

    async function fetchActivity() {
      try {
        const res = await fetch('/api/dashboard/activity?hours=2&limit=30', { cache: 'no-store' })
        if (!res.ok) return
        const data: { items: ActivityItem[] } = await res.json()
        if (active && Array.isArray(data.items)) {
          setItems(data.items)
        }
      } catch {
        // silencia erros de rede
      }
    }

    if (!initialItems.length) void fetchActivity()
    const id = setInterval(fetchActivity, 30_000)

    return () => {
      active = false
      clearInterval(id)
    }
  }, [initialItems.length])

  // Recalcula largura quando a lista muda
  useEffect(() => {
    if (!trackRef.current) return
    const half = trackRef.current.scrollWidth / 2
    setTranslatePx(half)
  }, [tickerItems])

  const duration = Math.max(30, Math.round(translatePx / 60)) // ~60 px/s

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '36px', overflow: 'hidden', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', maxWidth: '100%', minWidth: 0 }}>
      <div style={{ flexShrink: 0, padding: '0 12px', height: '100%', display: 'flex', alignItems: 'center', background: 'rgba(168,85,247,0.2)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>Ao vivo</span>
      </div>
      <div style={{ overflow: 'hidden', flex: 1, minWidth: 0, position: 'relative', height: '36px' }}>
        <style>{`
          @keyframes ticker-px {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-${translatePx}px); }
          }
          .ticker-track {
            animation: ticker-px ${duration}s linear infinite;
            will-change: transform;
          }
        `}</style>
        <div
          ref={trackRef}
          className={translatePx > 0 ? 'ticker-track' : ''}
          style={{ position: 'absolute', top: 0, left: 0, height: '36px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}
        >
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={`${item.key}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0 20px', fontSize: '12px', color: '#d1d5db', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
              {item.text}
              <span style={{ color: 'rgba(255,255,255,0.15)', marginLeft: '12px' }}>|</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

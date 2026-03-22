"use client"

import { useEffect, useRef, useState } from 'react'

const items = [
  { dot: '#f472b6', text: '🎂 Novo pedido — Ana Lima: Bolo Red Velvet 30 pessoas' },
  { dot: '#60a5fa', text: '💬 Carlos Souza: "Pode ser entregue às 16h?"' },
  { dot: '#34d399', text: '✅ Pedido de Maria Oliveira marcado como Pronto' },
  { dot: '#f472b6', text: '🎉 Novo pedido — João Pedro: 150 salgados mistos' },
  { dot: '#fbbf24', text: '⚠️ Entrega de Beatriz Melo em 2h — verificar status' },
  { dot: '#60a5fa', text: '💬 Fernanda Costa: "Podem fazer sem glúten?"' },
  { dot: '#34d399', text: '✅ Pedido de Lucas Ferreira entregue com sucesso' },
  { dot: '#f472b6', text: '🎂 Novo pedido — Camila Torres: Kit Festa 40 pessoas' },
  { dot: '#a78bfa', text: '📅 Agendamento confirmado — Diana Rocha: Sábado 14h' },
  { dot: '#fbbf24', text: '⚠️ Produção atrasada — Bolo Morango de Ricardo Alves' },
]

export function ActivityTicker() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [translatePx, setTranslatePx] = useState(0)

  useEffect(() => {
    if (!trackRef.current) return
    const half = trackRef.current.scrollWidth / 2
    setTranslatePx(half)
  }, [])

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
            animation: ticker-px 50s linear infinite;
            will-change: transform;
          }
        `}</style>
        <div
          ref={trackRef}
          className={translatePx > 0 ? 'ticker-track' : ''}
          style={{ position: 'absolute', top: 0, left: 0, height: '36px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}
        >
          {[...items, ...items].map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0 20px', fontSize: '12px', color: '#d1d5db', whiteSpace: 'nowrap', flexShrink: 0 }}>
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

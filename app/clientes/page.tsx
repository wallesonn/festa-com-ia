import { getConversations, getOrders } from '@/lib/mockData'

export default function ClientesPage() {
  const conv = getConversations()
  const ord = getOrders()
  const counts = new Map<string, { conversations: number; orders: number }>()
  conv.forEach(c => counts.set(c.clientName, { conversations: (counts.get(c.clientName)?.conversations || 0) + 1, orders: counts.get(c.clientName)?.orders || 0 }))
  ord.forEach(o => counts.set(o.clientName, { conversations: counts.get(o.clientName)?.conversations || 0, orders: (counts.get(o.clientName)?.orders || 0) + 1 }))
  const items = Array.from(counts.entries()).map(([name, v]) => ({ name, ...v }))

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">Lista de clientes gerada a partir dos dados mockados.</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <div key={it.name} className="card p-4">
            <div className="font-medium">{it.name}</div>
            <div className="text-sm text-gray-600">Conversas: {it.conversations} · Pedidos: {it.orders}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

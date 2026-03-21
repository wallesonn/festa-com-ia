import { fmtDateShort, bucketColor } from '@/lib/utils'
import { Order } from '@/lib/types'

export function OrderCard({ order }: { order: Order }) {
  return (
    <div className={`card p-3 ${bucketColorFromOrder(order)}`}>
      <div className="text-xs text-gray-500 mb-1">{badgeFromOrder(order)}</div>
      <div className="text-sm font-medium">Cliente: {order.clientName}</div>
      <div className="text-sm text-gray-700">Produto: {order.productType}</div>
      <div className="text-sm text-gray-700">Entrega: {fmtDateShort(order.eventDate)}</div>
      <div className="text-sm text-gray-700">Pessoas: {order.peopleCount}</div>
    </div>
  )
}

function badgeFromOrder(order: Order) {
  switch (bucketFromOrder(order)) {
    case 'proximo':
      return '🟠 Próximo'
    case 'urgente':
      return '🔴 Urgente'
    case 'planejado':
      return '🟢 Planejado'
    case 'atendimento':
      return '🔵 Atendimento'
    case 'finalizado':
      return '⚪ Finalizado'
    case 'cancelado':
      return '⚫ Cancelado'
  }
}

import { classifyOrderBucket as bucketFromOrder } from '@/lib/utils'

function bucketColorFromOrder(order: Order) {
  return bucketColor(bucketFromOrder(order))
}

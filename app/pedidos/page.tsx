import { KanbanColumn } from '@/components/kanban/KanbanColumn'
import { OrderCard } from '@/components/orders/OrderCard'
import { getOrders } from '@/lib/mockData'
import { classifyOrderBucket, bucketLabel } from '@/lib/utils'
import { OrderBucket } from '@/lib/types'

const order: OrderBucket[] = ['atendimento', 'planejado', 'proximo', 'urgente', 'finalizado', 'cancelado']

export default function PedidosPage() {
  const data = getOrders()
  const buckets = new Map<OrderBucket, ReturnType<typeof getOrders>>()
  order.forEach(b => buckets.set(b, data.filter(o => classifyOrderBucket(o) === b)))

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">Kanban por prioridade e status, com classificação automática pela data do evento.</div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {order.map(b => (
          <KanbanColumn key={b} title={bucketLabel(b)} count={buckets.get(b)?.length || 0}>
            {(buckets.get(b) || []).map(o => (
              <OrderCard key={o.id} order={o} />
            ))}
          </KanbanColumn>
        ))}
      </div>
    </div>
  )
}

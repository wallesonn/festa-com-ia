import { PedidosView } from '@/components/pedidos/PedidosView'
import { getFirstProfessional, getOrdersWithPayments } from '@/lib/db/queries'
import { dbRowToOrder } from '@/lib/db/mappers'
import { getOrders } from '@/lib/mockData'
import type { Order } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PedidosPage() {
  let orders: Order[]
  try {
    const professional = await getFirstProfessional()
    const rows = professional ? await getOrdersWithPayments(professional.id) : []
    orders = rows.map(dbRowToOrder)
  } catch {
    orders = getOrders()
  }

  return <PedidosView initialOrders={orders} />
}


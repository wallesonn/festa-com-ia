import { PedidosView } from '@/components/pedidos/PedidosView'
import { getFirstProfessional, getActiveOrders } from '@/lib/db/queries'
import { dbRowToOrder } from '@/lib/db/mappers'
import type { Order } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PedidosPage() {
  let orders: Order[]
  let professionalId = ''
  try {
    const professional = await getFirstProfessional()
    professionalId = professional?.id ?? ''
    const rows = professional ? await getActiveOrders(professional.id) : []
    orders = rows.map(dbRowToOrder)
  } catch {
    orders = []
  }

  return <PedidosView initialOrders={orders} professionalId={professionalId} />
}


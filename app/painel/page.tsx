import { PainelBoard } from '@/components/painel/PainelBoard'
import { getFirstProfessional, getActiveOrders } from '@/lib/db/queries'
import { dbRowToOrder } from '@/lib/db/mappers'
import type { Order } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PainelPage() {
  let orders: Order[]
  let professionalId = ''
  try {
    const professional = await getFirstProfessional()
    professionalId = professional?.id ?? ''
    console.log('[painel] professional resolved:', { id: professionalId, found: !!professional })
    const rows = professional ? await getActiveOrders(professional.id) : []
    console.log('[painel] active orders rows:', rows.length)
    orders = rows.map(dbRowToOrder)

    if (process.env.NODE_ENV !== 'production') {
      console.log('[painel] orders mapped:', {
        count: orders.length,
        sample: orders.slice(0, 10).map((order) => ({
          id: order.id,
          painelStatus: order.painelStatus,
          deliveryDatetime: order.deliveryDatetime,
          updatedAt: order.updatedAt,
        })),
      })
    }
  } catch (err) {
    console.error('[painel] failed to load orders:', err)
    orders = []
  }

  return <PainelBoard initialOrders={orders} professionalId={professionalId} />
}

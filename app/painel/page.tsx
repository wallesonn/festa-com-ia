import { PainelBoard } from '@/components/painel/PainelBoard'
import { getFirstProfessional, getOrdersWithPayments } from '@/lib/db/queries'
import { dbRowToOrder } from '@/lib/db/mappers'
import type { Order } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PainelPage() {
  let orders: Order[]
  try {
    const professional = await getFirstProfessional()
    const rows = professional ? await getOrdersWithPayments(professional.id) : []
    orders = rows.map(dbRowToOrder)
  } catch {
    orders = []
  }

  return <PainelBoard initialOrders={orders} />
}

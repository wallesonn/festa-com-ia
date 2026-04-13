import type {
  Order, Payment, ChatMessage,
  ProductType, OrderStatus, PainelStatus,
  DeliveryType, PaymentMethod, PaymentStatus, MessageSender,
} from '@/lib/types'

export type DbOrderRow = {
  id: string
  client_id: string
  conversation_id: string | null
  product_type: string
  product_subtype: string | null
  event_date: string | null
  delivery_datetime: string | null
  delivery_type: string
  people_count: number | null
  observations: string | null
  internal_notes: string | null
  total_price: number
  status: string
  painel_status: string
  last_message: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
  client_name: string
  client_phone: string
  payment_id: string | null
  payment_method: string | null
  payment_status: string | null
  payment_total_amount: number | null
  payment_paid_amount: number | null
  payment_due_amount: number | null
  payment_deposit_percent: number | null
  payment_deposit_paid_at: string | null
  payment_full_paid_at: string | null
  messages_json: Array<{ id: string; sender: string; text: string; at: string; suggestions?: string[] | null }> | null
}

export function dbRowToOrder(row: DbOrderRow): Order {
  const payment: Payment = {
    id: row.payment_id ?? row.id,
    orderId: row.id,
    method: (row.payment_method ?? 'pix') as PaymentMethod,
    status: (row.payment_status ?? 'pendente') as PaymentStatus,
    totalAmount: row.payment_total_amount ?? row.total_price,
    paidAmount: row.payment_paid_amount ?? 0,
    dueAmount: row.payment_due_amount ?? row.total_price,
    depositPercent: row.payment_deposit_percent ?? 50,
    depositPaidAt: row.payment_deposit_paid_at ?? undefined,
    fullPaidAt: row.payment_full_paid_at ?? undefined,
  }

  const messages: ChatMessage[] = (row.messages_json ?? []).map(m => ({
    id: m.id,
    sender: m.sender as MessageSender,
    text: m.text,
    at: m.at,
    ...(m.suggestions?.length ? { suggestions: m.suggestions } : {}),
  }))

  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    productType: row.product_type as ProductType,
    productSubtype: row.product_subtype ?? '',
    eventDate: row.event_date ?? row.delivery_datetime ?? new Date().toISOString(),
    deliveryDatetime: row.delivery_datetime ?? new Date().toISOString(),
    deliveryType: (row.delivery_type ?? 'entrega') as DeliveryType,
    peopleCount: row.people_count ?? 0,
    observations: row.observations ?? '',
    internalNotes: row.internal_notes ?? '',
    totalPrice: row.total_price,
    status: row.status as OrderStatus,
    painelStatus: row.painel_status as PainelStatus,
    payment,
    lastMessage: row.last_message ?? '',
    lastMessageAt: row.last_message_at ?? row.updated_at,
    messages,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

'use server'

import { getSql } from '@/lib/db/client'
import { getFirstProfessional } from '@/lib/db/queries'
import { dbRowToOrder } from '@/lib/db/mappers'
import type { DbOrderRow } from '@/lib/db/mappers'
import type { Order } from '@/lib/types'

export type CreateOrderInput = {
  clientName: string
  clientPhone: string
  productType: string
  productSubtype: string
  observations: string
  peopleCount: number
  deliveryDatetime: string
  totalPrice: number
  paymentMethod: string
}

export type CreateOrderResult =
  | { success: true; order: Order }
  | { success: false; error: string }

export type DeleteOrderResult =
  | { success: true }
  | { success: false; error: string }

export type UpdateOrderPainelStatusResult =
  | { success: true }
  | { success: false; error: string }

export async function updateOrderPainelStatus(orderId: string, painelStatus: string): Promise<UpdateOrderPainelStatusResult> {
  try {
    const sql = getSql()
    await sql`UPDATE orders SET painel_status = ${painelStatus}, updated_at = now() WHERE id = ${orderId}`
    return { success: true }
  } catch (err) {
    console.error('[updateOrderPainelStatus]', err)
    return { success: false, error: 'Erro ao atualizar o status do pedido.' }
  }
}

export async function deleteOrder(orderId: string): Promise<DeleteOrderResult> {
  try {
    const sql = getSql()
    await sql`DELETE FROM orders WHERE id = ${orderId}`
    return { success: true }
  } catch (err) {
    console.error('[deleteOrder]', err)
    return { success: false, error: 'Erro ao deletar pedido.' }
  }
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  try {
    const sql = getSql()

    const professional = await getFirstProfessional()
    if (!professional) {
      return { success: false, error: 'Profissional não encontrado' }
    }

    const existing = await sql<Array<{ id: string }>>`
      SELECT id FROM clients
      WHERE professional_id = ${professional.id}
        AND phone = ${input.clientPhone}
      LIMIT 1
    `

    let clientId: string
    if (existing.length > 0) {
      clientId = existing[0].id
    } else {
      const [newClient] = await sql<Array<{ id: string }>>`
        INSERT INTO clients (professional_id, name, phone, source)
        VALUES (${professional.id}, ${input.clientName}, ${input.clientPhone}, 'manual')
        RETURNING id
      `
      clientId = newClient.id
    }

    const deliveryDt = input.deliveryDatetime || null

    const [newOrder] = await sql<Array<{ id: string }>>`
      INSERT INTO orders (
        professional_id, client_id, product_type, product_subtype,
        observations, people_count, delivery_datetime, event_date,
        total_price, status, painel_status, delivery_type
      ) VALUES (
        ${professional.id}, ${clientId}, ${input.productType},
        ${input.productSubtype || null},
        ${input.observations || null}, ${input.peopleCount || null},
        ${deliveryDt}, ${deliveryDt},
        ${input.totalPrice || 0}, 'em_andamento', 'agendado', 'entrega'
      )
      RETURNING id
    `

    await sql`
      INSERT INTO payments (
        professional_id, order_id, method, status,
        total_amount, paid_amount, due_amount, deposit_percent
      ) VALUES (
        ${professional.id}, ${newOrder.id},
        ${input.paymentMethod || 'pix'}, 'pendente',
        ${input.totalPrice || 0}, 0, ${input.totalPrice || 0}, 50
      )
    `

    const rows = await sql<DbOrderRow[]>`
      SELECT
        o.id, o.client_id, o.conversation_id, o.product_type, o.product_subtype,
        o.event_date, o.delivery_datetime, o.delivery_type, o.people_count,
        o.observations, o.internal_notes, o.total_price, o.status, o.painel_status,
        o.last_message, o.last_message_at, o.created_at, o.updated_at,
        c.name  AS client_name,
        c.phone AS client_phone,
        p.id             AS payment_id,
        p.method         AS payment_method,
        p.status         AS payment_status,
        p.total_amount   AS payment_total_amount,
        p.paid_amount    AS payment_paid_amount,
        p.due_amount     AS payment_due_amount,
        p.deposit_percent    AS payment_deposit_percent,
        p.deposit_paid_at    AS payment_deposit_paid_at,
        p.full_paid_at       AS payment_full_paid_at,
        '[]'::json AS messages_json
      FROM orders o
      JOIN clients c ON c.id = o.client_id
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE o.id = ${newOrder.id}
    `

    if (rows.length === 0) {
      return { success: false, error: 'Erro ao recuperar pedido criado' }
    }

    return { success: true, order: dbRowToOrder(rows[0]) }
  } catch (err) {
    console.error('[createOrder]', err)
    return { success: false, error: 'Erro ao salvar pedido. Verifique a conexão e tente novamente.' }
  }
}

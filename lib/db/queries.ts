import { getSql } from './client'
import type { Tables } from '@/lib/database.types'
import type { DbOrderRow } from './mappers'

export async function getFirstProfessional() {
  const sql = getSql()
  const rows = await sql<Tables<'professionals'>[]>`
    SELECT * FROM professionals
    WHERE status = 'active'
    ORDER BY created_at ASC
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function getProfessionalByAuthUserId(authUserId: string) {
  const sql = getSql()
  const rows = await sql<Tables<'professionals'>[]>`
    SELECT * FROM professionals
    WHERE auth_user_id = ${authUserId}
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function getOrdersWithPayments(professionalId: string): Promise<DbOrderRow[]> {
  const sql = getSql()
  return sql<DbOrderRow[]>`
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
      COALESCE(
        (SELECT json_agg(
          json_build_object('id', m.id, 'sender', m.sender, 'text', m.text, 'at', m.sent_at, 'suggestions', m.suggestions)
          ORDER BY m.sent_at ASC
        ) FROM (
          SELECT id, sender, text, sent_at, suggestions FROM messages
          WHERE conversation_id = o.conversation_id
          ORDER BY sent_at DESC LIMIT 10
        ) m),
        '[]'::json
      ) AS messages_json
    FROM orders o
    JOIN clients c ON c.id = o.client_id
    LEFT JOIN payments p ON p.order_id = o.id
    WHERE o.professional_id = ${professionalId}
    ORDER BY o.updated_at DESC
  `
}

export async function getConversationsByProfessional(professionalId: string) {
  const sql = getSql()
  return sql<Array<Tables<'conversations'> & { client_name: string; client_phone: string }>>`
    SELECT conv.*, c.name AS client_name, c.phone AS client_phone
    FROM conversations conv
    JOIN clients c ON c.id = conv.client_id
    WHERE conv.professional_id = ${professionalId}
    ORDER BY conv.last_message_at DESC NULLS LAST
  `
}

export type DbMessageRow = {
  id: string
  conversation_id: string
  order_id: string | null
  sender: string
  direction: string
  text: string
  status: string
  sent_at: string
  suggestions: string[] | null
}

export async function getLastMessagesByConversation(conversationId: string, limit = 10): Promise<DbMessageRow[]> {
  const sql = getSql()
  return sql<DbMessageRow[]>`
    SELECT id, conversation_id, order_id, sender, direction, text, status, sent_at, suggestions
    FROM messages
    WHERE conversation_id = ${conversationId}
    ORDER BY sent_at DESC
    LIMIT ${limit}
  `
}

export async function getClientsByProfessional(professionalId: string) {
  const sql = getSql()
  return sql<Tables<'clients'>[]>`
    SELECT * FROM clients
    WHERE professional_id = ${professionalId}
    ORDER BY name ASC
  `
}

export async function getPaymentsByProfessional(professionalId: string) {
  const sql = getSql()
  return sql<Array<Tables<'payments'> & { product_type: string; client_name: string }>>`
    SELECT p.*, o.product_type, c.name AS client_name
    FROM payments p
    JOIN orders o ON o.id = p.order_id
    JOIN clients c ON c.id = o.client_id
    WHERE p.professional_id = ${professionalId}
    ORDER BY p.order_id DESC
  `
}

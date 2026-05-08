import { getSql } from './client'
import type { Tables } from '@/lib/database.types'
import type { DbOrderRow } from './mappers'

export async function getFirstProfessional() {
  const sql = getSql()
  const rows = await sql<Tables<'professionals'>[]>`
    SELECT * FROM professionals
    ORDER BY created_at ASC
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
      c.profile_photo_url AS client_photo_url,
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
      ) AS messages_json,
      COALESCE(
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.conversation_id = o.conversation_id
            AND m.sender = 'client'
            AND m.sent_at > COALESCE(
              (
                SELECT MAX(m2.sent_at)
                FROM messages m2
                WHERE m2.conversation_id = o.conversation_id
                  AND m2.sender = 'attendant'
              ),
              'epoch'::timestamptz
            )
        ),
        0
      ) AS unread_client_messages_count
    FROM orders o
    JOIN clients c ON c.id = o.client_id
    LEFT JOIN payments p ON p.order_id = o.id
    WHERE o.professional_id = ${professionalId}
      AND o.archived_at IS NULL
    ORDER BY o.updated_at DESC
  `
}

// Pedidos ativos = tudo EXCETO os arquivados (entregue/cancelado há mais de 3 dias)
export async function getActiveOrders(professionalId: string): Promise<DbOrderRow[]> {
  const sql = getSql()
  return sql<DbOrderRow[]>`
    SELECT
      o.id, o.client_id, o.conversation_id, o.product_type, o.product_subtype,
      o.event_date, o.delivery_datetime, o.delivery_type, o.people_count,
      o.observations, o.internal_notes, o.total_price, o.status, o.painel_status,
      o.last_message, o.last_message_at, o.created_at, o.updated_at,
      c.name  AS client_name,
      c.phone AS client_phone,
      c.profile_photo_url AS client_photo_url,
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
      ) AS messages_json,
      COALESCE(
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.conversation_id = o.conversation_id
            AND m.sender = 'client'
            AND m.sent_at > COALESCE(
              (
                SELECT MAX(m2.sent_at)
                FROM messages m2
                WHERE m2.conversation_id = o.conversation_id
                  AND m2.sender = 'attendant'
              ),
              'epoch'::timestamptz
            )
        ),
        0
      ) AS unread_client_messages_count
    FROM orders o
    JOIN clients c ON c.id = o.client_id
    LEFT JOIN payments p ON p.order_id = o.id
    WHERE o.professional_id = ${professionalId}
      AND o.archived_at IS NULL
      AND NOT (
        o.painel_status IN ('entregue','cancelado')
        AND COALESCE(o.delivery_datetime, o.updated_at) < CURRENT_DATE - INTERVAL '3 days'
      )
    ORDER BY o.updated_at DESC
  `
}

export type ArchivedOrderRow = {
  id: string
  client_name: string
  client_phone: string
  product_type: string
  product_subtype: string
  delivery_datetime: string | null
  archived_at: string | null
  delivery_type: string
  people_count: number
  total_price: number
  painel_status: string
  payment_method: string | null
  payment_status: string | null
  paid_amount: number | null
  created_at: string
  updated_at: string
  observations: string | null
  internal_notes: string | null
}

export async function getArchivedOrders(professionalId: string): Promise<ArchivedOrderRow[]> {
  const sql = getSql()
  return sql<ArchivedOrderRow[]>`
    SELECT
      o.id,
      c.name             AS client_name,
      c.phone            AS client_phone,
      o.product_type,
      o.product_subtype,
      o.delivery_datetime,
      o.archived_at,
      o.delivery_type,
      o.people_count,
      o.total_price,
      o.painel_status,
      o.observations,
      o.internal_notes,
      o.created_at,
      o.updated_at,
      p.method           AS payment_method,
      p.status           AS payment_status,
      p.paid_amount
    FROM orders o
    JOIN clients c ON c.id = o.client_id
    LEFT JOIN payments p ON p.order_id = o.id
    WHERE o.professional_id = ${professionalId}
      AND (
        o.archived_at IS NOT NULL
        OR (
          o.painel_status IN ('entregue','cancelado')
          AND COALESCE(o.delivery_datetime, o.updated_at) < CURRENT_DATE - INTERVAL '3 days'
        )
      )
    ORDER BY COALESCE(o.archived_at, o.delivery_datetime, o.updated_at) DESC
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

export type DashboardStats = {
  messages_today: number
  messages_yesterday: number
  orders_in_progress: number
  orders_delivering_today: number
  orders_finished_month: number
  orders_finished_prev_month: number
  new_clients_week: number
  new_clients_prev_week: number
  revenue_month: number
  revenue_prev_month: number
  total_active: number
  painel_atendimento: number
  painel_agendado: number
  painel_preparando: number
  painel_pronto: number
  painel_entregue: number
  weekday_counts: number[] // Seg..Dom (7 valores) — pedidos criados na semana atual
  monthly_revenue: Array<{ month: string; total: number }> // 6 últimos meses ASC
  top_products: Array<{ name: string; orders: number }>
}

export async function getDashboardStats(professionalId: string): Promise<DashboardStats> {
  const sql = getSql()
  const [row] = await sql<[DashboardStats]>`
    WITH
    m_today AS (
      SELECT COUNT(*)::int AS c FROM messages
      WHERE professional_id = ${professionalId} AND sent_at::date = CURRENT_DATE
    ),
    m_yesterday AS (
      SELECT COUNT(*)::int AS c FROM messages
      WHERE professional_id = ${professionalId} AND sent_at::date = CURRENT_DATE - INTERVAL '1 day'
    ),
    o_inprogress AS (
      SELECT COUNT(*)::int AS c FROM orders
      WHERE professional_id = ${professionalId}
        AND archived_at IS NULL
        AND painel_status IN ('preparando','pronto')
    ),
    o_today AS (
      SELECT COUNT(*)::int AS c FROM orders
      WHERE professional_id = ${professionalId}
        AND archived_at IS NULL
        AND delivery_datetime::date = CURRENT_DATE
        AND painel_status NOT IN ('entregue','cancelado')
    ),
    o_fin_month AS (
      SELECT COUNT(*)::int AS c FROM orders
      WHERE professional_id = ${professionalId}
        AND painel_status = 'entregue'
        AND updated_at >= date_trunc('month', CURRENT_DATE)
    ),
    o_fin_prev AS (
      SELECT COUNT(*)::int AS c FROM orders
      WHERE professional_id = ${professionalId}
        AND painel_status = 'entregue'
        AND updated_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
        AND updated_at <  date_trunc('month', CURRENT_DATE)
    ),
    c_week AS (
      SELECT COUNT(*)::int AS c FROM clients
      WHERE professional_id = ${professionalId}
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    ),
    c_prev_week AS (
      SELECT COUNT(*)::int AS c FROM clients
      WHERE professional_id = ${professionalId}
        AND created_at >= CURRENT_DATE - INTERVAL '14 days'
        AND created_at <  CURRENT_DATE - INTERVAL '7 days'
    ),
    r_month AS (
      SELECT COALESCE(SUM(o.total_price),0)::numeric AS total
      FROM orders o
      WHERE o.professional_id = ${professionalId}
        AND o.painel_status = 'entregue'
        AND o.delivery_datetime >= date_trunc('month', CURRENT_DATE)
        AND o.delivery_datetime <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
    ),
    r_prev AS (
      SELECT COALESCE(SUM(o.total_price),0)::numeric AS total
      FROM orders o
      WHERE o.professional_id = ${professionalId}
        AND o.painel_status = 'entregue'
        AND o.delivery_datetime >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
        AND o.delivery_datetime <  date_trunc('month', CURRENT_DATE)
    ),
    painel AS (
      SELECT
        COUNT(*) FILTER (WHERE painel_status = 'atendimento')::int AS atendimento,
        COUNT(*) FILTER (WHERE painel_status = 'agendado')::int    AS agendado,
        COUNT(*) FILTER (WHERE painel_status = 'preparando')::int  AS preparando,
        COUNT(*) FILTER (WHERE painel_status = 'pronto')::int      AS pronto,
        COUNT(*) FILTER (WHERE painel_status = 'entregue')::int    AS entregue,
        COUNT(*) FILTER (WHERE painel_status NOT IN ('entregue','cancelado'))::int AS ativo
      FROM orders WHERE professional_id = ${professionalId}
        AND archived_at IS NULL
    ),
    week_days AS (
      SELECT
        EXTRACT(ISODOW FROM created_at)::int AS dow,
        COUNT(*)::int AS c
      FROM orders
      WHERE professional_id = ${professionalId}
        AND created_at >= date_trunc('week', CURRENT_DATE)
        AND created_at <  date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
      GROUP BY 1
    ),
    week_arr AS (
      SELECT ARRAY[
        COALESCE((SELECT c FROM week_days WHERE dow = 1),0),
        COALESCE((SELECT c FROM week_days WHERE dow = 2),0),
        COALESCE((SELECT c FROM week_days WHERE dow = 3),0),
        COALESCE((SELECT c FROM week_days WHERE dow = 4),0),
        COALESCE((SELECT c FROM week_days WHERE dow = 5),0),
        COALESCE((SELECT c FROM week_days WHERE dow = 6),0),
        COALESCE((SELECT c FROM week_days WHERE dow = 7),0)
      ] AS arr
    ),
    months AS (
      SELECT
        to_char(date_trunc('month', d), 'YYYY-MM') AS month,
        COALESCE(SUM(o.total_price),0)::numeric AS total
      FROM generate_series(
        date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
        date_trunc('month', CURRENT_DATE),
        INTERVAL '1 month'
      ) d
      LEFT JOIN orders o
        ON o.professional_id = ${professionalId}
       AND o.painel_status = 'entregue'
       AND o.delivery_datetime IS NOT NULL
       AND date_trunc('month', o.delivery_datetime) = date_trunc('month', d)
      GROUP BY 1
      ORDER BY 1 ASC
    ),
    months_json AS (
      SELECT COALESCE(json_agg(json_build_object('month', month, 'total', total) ORDER BY month), '[]'::json) AS arr
      FROM months
    ),
    products AS (
      SELECT product_type AS name, COUNT(*)::int AS orders
      FROM orders
      WHERE professional_id = ${professionalId}
      GROUP BY product_type
      ORDER BY orders DESC
      LIMIT 5
    ),
    products_json AS (
      SELECT COALESCE(json_agg(json_build_object('name', name, 'orders', orders) ORDER BY orders DESC), '[]'::json) AS arr
      FROM products
    )
    SELECT
      (SELECT c FROM m_today)         AS messages_today,
      (SELECT c FROM m_yesterday)     AS messages_yesterday,
      (SELECT c FROM o_inprogress)    AS orders_in_progress,
      (SELECT c FROM o_today)         AS orders_delivering_today,
      (SELECT c FROM o_fin_month)     AS orders_finished_month,
      (SELECT c FROM o_fin_prev)      AS orders_finished_prev_month,
      (SELECT c FROM c_week)          AS new_clients_week,
      (SELECT c FROM c_prev_week)     AS new_clients_prev_week,
      (SELECT total FROM r_month)     AS revenue_month,
      (SELECT total FROM r_prev)      AS revenue_prev_month,
      (SELECT ativo FROM painel)      AS total_active,
      (SELECT atendimento FROM painel) AS painel_atendimento,
      (SELECT agendado FROM painel)    AS painel_agendado,
      (SELECT preparando FROM painel)  AS painel_preparando,
      (SELECT pronto FROM painel)      AS painel_pronto,
      (SELECT entregue FROM painel)    AS painel_entregue,
      (SELECT arr FROM week_arr)       AS weekday_counts,
      (SELECT arr FROM months_json)    AS monthly_revenue,
      (SELECT arr FROM products_json)  AS top_products
  `
  return row
}

export type RecentConversationRow = {
  id: string
  client_id: string
  client_name: string
  client_phone: string
  status: string
  unread_count: number
  last_message: string | null
  last_message_at: string | null
  last_sender: 'client' | 'attendant' | null
  last_direction: 'inbound' | 'outbound' | null
}

export async function getRecentConversations(professionalId: string, limit = 20): Promise<RecentConversationRow[]> {
  const sql = getSql()
  return sql<RecentConversationRow[]>`
    SELECT
      conv.id,
      conv.client_id,
      c.name  AS client_name,
      c.phone AS client_phone,
      conv.status,
      conv.unread_count,
      conv.last_message,
      conv.last_message_at,
      lm.sender    AS last_sender,
      lm.direction AS last_direction
    FROM conversations conv
    JOIN clients c ON c.id = conv.client_id
    LEFT JOIN LATERAL (
      SELECT sender, direction
      FROM messages
      WHERE conversation_id = conv.id
      ORDER BY sent_at DESC
      LIMIT 1
    ) lm ON TRUE
    WHERE conv.professional_id = ${professionalId}
      AND conv.archived_at IS NULL
    ORDER BY conv.last_message_at DESC NULLS LAST
    LIMIT ${limit}
  `
}

export type ActivityKind =
  | 'order_created'
  | 'order_finalized'
  | 'message_inbound'
  | 'message_outbound'
  | 'payment'

export type ActivityItem = {
  kind: ActivityKind
  at: string
  client_name: string | null
  title: string
  amount: number | null
}

export async function getRecentActivity(professionalId: string, hours = 2, limit = 30): Promise<ActivityItem[]> {
  const sql = getSql()
  return sql<ActivityItem[]>`
    WITH events AS (
      -- Pedidos criados
      SELECT
        'order_created'::text AS kind,
        o.created_at          AS at,
        c.name                AS client_name,
        COALESCE(o.product_type,'pedido') || CASE WHEN o.people_count IS NOT NULL THEN ' · ' || o.people_count || 'p' ELSE '' END AS title,
        NULL::numeric         AS amount
      FROM orders o
      JOIN clients c ON c.id = o.client_id
      WHERE o.professional_id = ${professionalId}
        AND o.created_at >= NOW() - (${hours}::int || ' hours')::interval

      UNION ALL

      -- Pedidos finalizados
      SELECT
        'order_finalized'::text AS kind,
        o.updated_at            AS at,
        c.name                  AS client_name,
        COALESCE(o.product_type,'pedido') AS title,
        NULL::numeric           AS amount
      FROM orders o
      JOIN clients c ON c.id = o.client_id
      WHERE o.professional_id = ${professionalId}
        AND o.status = 'finalizado'
        AND o.updated_at >= NOW() - (${hours}::int || ' hours')::interval

      UNION ALL

      -- Mensagens (inbound = do cliente; outbound = do atendente)
      SELECT
        CASE WHEN m.direction = 'outbound' THEN 'message_outbound' ELSE 'message_inbound' END::text AS kind,
        m.sent_at                                           AS at,
        c.name                                              AS client_name,
        LEFT(COALESCE(m.text,''), 80)                       AS title,
        NULL::numeric                                       AS amount
      FROM messages m
      JOIN conversations conv ON conv.id = m.conversation_id
      JOIN clients c           ON c.id = conv.client_id
      WHERE m.professional_id = ${professionalId}
        AND m.sent_at >= NOW() - (${hours}::int || ' hours')::interval

      UNION ALL

      -- Pagamentos (quando sinal ou total foi pago)
      SELECT
        'payment'::text AS kind,
        COALESCE(p.full_paid_at, p.deposit_paid_at) AS at,
        c.name                                      AS client_name,
        CASE
          WHEN p.full_paid_at IS NOT NULL THEN 'pagamento total'
          ELSE 'sinal pago'
        END                                         AS title,
        p.paid_amount                               AS amount
      FROM payments p
      JOIN orders o  ON o.id = p.order_id
      JOIN clients c ON c.id = o.client_id
      WHERE p.professional_id = ${professionalId}
        AND COALESCE(p.full_paid_at, p.deposit_paid_at) >= NOW() - (${hours}::int || ' hours')::interval
    )
    SELECT kind, at, client_name, title, amount
    FROM events
    WHERE at IS NOT NULL
    ORDER BY at DESC
    LIMIT ${limit}
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

'use server'

import { getSql } from '@/lib/db/client'
import { getLastMessagesByConversation } from '@/lib/db/queries'
import type { ChatMessage, MessageSender } from '@/lib/types'

export async function fetchConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const rows = await getLastMessagesByConversation(conversationId, 10)
  return rows
    .map((row) => ({
      id: row.id,
      sender: row.sender as MessageSender,
      text: row.text,
      at: row.sent_at,
      ...(row.suggestions?.length ? { suggestions: row.suggestions } : {}),
    }))
    .reverse() // rows vêm DESC do banco — inverte para exibição cronológica (ASC)
}

export type SendMessageParams = {
  conversationId: string
  orderId: string | null
  professionalId: string
  text: string
}

export type SendMessageResult = {
  ok: boolean
  messageId?: string
  error?: string
}

export async function sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
  const { conversationId, orderId, professionalId, text } = params
  const sql = getSql()

  // 1. Insere a mensagem no Postgres com status pending_send
  const [inserted] = await sql<[{ id: string }]>`
    INSERT INTO messages (professional_id, conversation_id, order_id, sender, direction, text, status, sent_at)
    VALUES (${professionalId}, ${conversationId}, ${orderId}, 'attendant', 'outbound', ${text}, 'pending_send', now())
    RETURNING id
  `

  // 2. Atualiza last_message na conversa
  await sql`
    UPDATE conversations
    SET last_message = ${text}, last_message_at = now()
    WHERE id = ${conversationId}
  `

  // 3. Notifica n8n via webhook (se configurado)
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: inserted.id,
          conversationId,
          orderId,
          professionalId,
          text,
          sender: 'attendant',
          direction: 'outbound',
        }),
      })

      if (!res.ok) {
        await sql`UPDATE messages SET status = 'failed', error_message = ${`webhook HTTP ${res.status}`} WHERE id = ${inserted.id}`
        return { ok: false, messageId: inserted.id, error: `Webhook retornou ${res.status}` }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      await sql`UPDATE messages SET status = 'failed', error_message = ${msg} WHERE id = ${inserted.id}`
      return { ok: false, messageId: inserted.id, error: msg }
    }
  }

  return { ok: true, messageId: inserted.id }
}

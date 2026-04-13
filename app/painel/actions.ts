'use server'

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

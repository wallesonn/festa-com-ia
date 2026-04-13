'use client'

import { useEffect, useRef, useState } from 'react'
import { fetchConversationMessages } from '@/app/painel/actions'
import type { ChatMessage } from '@/lib/types'

export function useConversationPolling(
  conversationId: string | null,
  intervalMs = 15_000,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }

    let cancelled = false

    async function poll() {
      setIsLoading(true)
      try {
        const msgs = await fetchConversationMessages(conversationId!)
        if (!cancelled) setMessages(msgs)
      } catch {
        // silent — mantém as mensagens anteriores em caso de erro
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void poll()

    timerRef.current = setInterval(() => { void poll() }, intervalMs)

    return () => {
      cancelled = true
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [conversationId, intervalMs])

  return { messages, isLoading }
}

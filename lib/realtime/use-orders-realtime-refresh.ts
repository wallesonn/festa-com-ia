'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const REALTIME_ENDPOINT = '/api/realtime/orders'
const REFRESH_DEBOUNCE_MS = 150

export function useOrdersRealtimeRefresh(paused: boolean) {
  const router = useRouter()
  const pausedRef = useRef(paused)
  const pendingRefreshRef = useRef(false)
  const refreshTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)

  useEffect(() => {
    pausedRef.current = paused

    if (!paused && pendingRefreshRef.current) {
      pendingRefreshRef.current = false
      router.refresh()
    }
  }, [paused, router])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const eventSource = new EventSource(REALTIME_ENDPOINT)

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }

      refreshTimerRef.current = globalThis.setTimeout(() => {
        refreshTimerRef.current = null

        if (pausedRef.current) {
          pendingRefreshRef.current = true
          return
        }

        router.refresh()
      }, REFRESH_DEBOUNCE_MS)
    }

    const handleChange = () => {
      scheduleRefresh()
    }

    eventSource.addEventListener('change', handleChange)

    return () => {
      eventSource.removeEventListener('change', handleChange)
      eventSource.close()

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }
  }, [router])
}

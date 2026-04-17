'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const REFRESH_DEBOUNCE_MS = 300

export function DashboardAutoRefresh() {
  const router = useRouter()
  const refreshTimerRef = useRef<number | null>(null)

  useEffect(() => {
    function scheduleRefresh() {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current)
      }

      refreshTimerRef.current = window.setTimeout(() => {
        router.refresh()
      }, REFRESH_DEBOUNCE_MS)
    }

    function handleOrdersUpdated() {
      scheduleRefresh()
    }

    window.addEventListener('festa-com-ia:browser-orders-updated', handleOrdersUpdated)
    window.addEventListener('storage', handleOrdersUpdated)

    return () => {
      window.removeEventListener('festa-com-ia:browser-orders-updated', handleOrdersUpdated)
      window.removeEventListener('storage', handleOrdersUpdated)
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current)
      }
    }
  }, [router])

  return null
}

'use client'

import { useEffect, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { updateOrderPainelStatus } from '@/app/pedidos/actions'
import type { Order, PainelStatus } from '@/lib/types'

const STORAGE_PREFIX = 'festa-com-ia-browser-orders:v1'
const SYNC_INTERVAL_MS = 30_000

export type PendingStatusUpdate = {
  orderId: string
  painelStatus: PainelStatus
  deliveryDatetime?: string
  createdAt: number
  attempts: number
}

type BrowserOrdersState = {
  professionalId: string | null
  orders: Order[]
  pendingStatusUpdates: PendingStatusUpdate[]
  hydrated: boolean
}

type StoredBrowserOrders = {
  professionalId: string
  orders: Order[]
  pendingStatusUpdates: PendingStatusUpdate[]
  savedAt: number
}

const state: BrowserOrdersState = {
  professionalId: null,
  orders: [],
  pendingStatusUpdates: [],
  hydrated: false,
}

const listeners = new Set<() => void>()
let syncTimer: ReturnType<typeof globalThis.setInterval> | null = null
let storageListenerInstalled = false
let flushInProgress = false

function canUseBrowserStorage() {
  return typeof window !== 'undefined'
}

function storageKey(professionalId: string) {
  return `${STORAGE_PREFIX}:${professionalId}`
}

function cloneOrders(orders: Order[]) {
  return orders.map((order) => ({
    ...order,
    payment: { ...order.payment },
    messages: order.messages.map((message) => ({ ...message })),
    deliveryAddress: order.deliveryAddress ? { ...order.deliveryAddress } : undefined,
  }))
}

function getSnapshot() {
  return {
    professionalId: state.professionalId,
    orders: cloneOrders(state.orders),
    pendingStatusUpdates: state.pendingStatusUpdates.map((action) => ({ ...action })),
    hydrated: state.hydrated,
  }
}

function readStoredSnapshot(professionalId: string): StoredBrowserOrders | null {
  if (!canUseBrowserStorage()) return null

  try {
    const raw = window.localStorage.getItem(storageKey(professionalId))
    if (!raw) return null

    const parsed = JSON.parse(raw) as StoredBrowserOrders
    if (!parsed || parsed.professionalId !== professionalId || !Array.isArray(parsed.orders)) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function persistSnapshot() {
  if (!canUseBrowserStorage() || !state.professionalId) return

  const payload: StoredBrowserOrders = {
    professionalId: state.professionalId,
    orders: state.orders,
    pendingStatusUpdates: state.pendingStatusUpdates,
    savedAt: Date.now(),
  }

  try {
    window.localStorage.setItem(storageKey(state.professionalId), JSON.stringify(payload))
  } catch {
    // Silent best-effort cache.
  }
}

function notifySubscribers(shouldPersist = true) {
  if (shouldPersist) {
    persistSnapshot()
  }

  listeners.forEach((listener) => listener())
}

function upsertPendingStatusUpdate(orderId: string, painelStatus: PainelStatus, deliveryDatetime?: string) {
  const nextAction: PendingStatusUpdate = {
    orderId,
    painelStatus,
    deliveryDatetime,
    createdAt: Date.now(),
    attempts: 0,
  }

  state.pendingStatusUpdates = [
    ...state.pendingStatusUpdates.filter((action) => action.orderId !== orderId),
    nextAction,
  ]
}

function removePendingStatusUpdate(orderId: string) {
  state.pendingStatusUpdates = state.pendingStatusUpdates.filter((action) => action.orderId !== orderId)
}

function setOrderStatusInState(orderId: string, painelStatus: PainelStatus, deliveryDatetime?: string) {
  const updatedAt = new Date().toISOString()
  state.orders = state.orders.map((order) => (
    order.id === orderId
      ? {
          ...order,
          painelStatus,
          ...(deliveryDatetime ? { deliveryDatetime, eventDate: deliveryDatetime } : {}),
          updatedAt,
        }
      : order
  ))
}

function ensureSyncInfrastructure() {
  if (!canUseBrowserStorage()) return

  if (!syncTimer) {
    syncTimer = globalThis.setInterval(() => {
      void flushPendingStatusUpdates()
    }, SYNC_INTERVAL_MS)

    void flushPendingStatusUpdates()
  }

  if (!storageListenerInstalled) {
    window.addEventListener('storage', handleStorageEvent)
    storageListenerInstalled = true
  }
}

function handleStorageEvent(event: StorageEvent) {
  if (!event.key || !event.newValue || !state.professionalId) return
  if (event.key !== storageKey(state.professionalId)) return

  try {
    const parsed = JSON.parse(event.newValue) as StoredBrowserOrders
    if (parsed.professionalId !== state.professionalId || !Array.isArray(parsed.orders)) return

    state.orders = cloneOrders(parsed.orders)
    state.pendingStatusUpdates = Array.isArray(parsed.pendingStatusUpdates)
      ? parsed.pendingStatusUpdates.map((action) => ({ ...action }))
      : []
    state.hydrated = true
    notifySubscribers(false)
  } catch {
    // Ignore malformed external updates.
  }
}

export function bootstrapBrowserOrders(professionalId: string, initialOrders: Order[]) {
  if (!professionalId) return

  if (state.hydrated && state.professionalId === professionalId) {
    ensureSyncInfrastructure()
    return
  }

  state.professionalId = professionalId

  const stored = readStoredSnapshot(professionalId)
  if (stored) {
    state.orders = cloneOrders(stored.orders)
    state.pendingStatusUpdates = Array.isArray(stored.pendingStatusUpdates)
      ? stored.pendingStatusUpdates.map((action) => ({ ...action }))
      : []
  } else {
    state.orders = cloneOrders(initialOrders)
    state.pendingStatusUpdates = []
  }

  state.hydrated = true
  notifySubscribers()
  ensureSyncInfrastructure()
}

async function flushPendingStatusUpdates() {
  if (flushInProgress || !state.professionalId || state.pendingStatusUpdates.length === 0) return

  flushInProgress = true
  try {
    const pending = [...state.pendingStatusUpdates].sort((a, b) => a.createdAt - b.createdAt)

    for (const action of pending) {
      const result = await updateOrderPainelStatus(action.orderId, action.painelStatus, action.deliveryDatetime)
      if (!result.success) {
        const nextAction = state.pendingStatusUpdates.find((item) => item.orderId === action.orderId)
        if (nextAction) {
          nextAction.attempts += 1
        }
        notifySubscribers()
        break
      }

      removePendingStatusUpdate(action.orderId)
      notifySubscribers()
    }
  } finally {
    flushInProgress = false
  }
}

export function updateOrderStatusLocal(orderId: string, painelStatus: PainelStatus, deliveryDatetime?: string) {
  setOrderStatusInState(orderId, painelStatus, deliveryDatetime)
  notifySubscribers()
}

export function previewOrderStatusLocal(orderId: string, painelStatus: PainelStatus) {
  setOrderStatusInState(orderId, painelStatus)
  notifySubscribers(false)
}

export function reorderOrderLocal(orderId: string, overId: string) {
  const activeOrder = state.orders.find((order) => order.id === orderId)
  const overOrder = state.orders.find((order) => order.id === overId)

  if (!activeOrder || !overOrder || activeOrder.painelStatus !== overOrder.painelStatus || orderId === overId) {
    return
  }

  const sameColumnOrders = state.orders.filter((order) => order.painelStatus === activeOrder.painelStatus)
  const otherOrders = state.orders.filter((order) => order.painelStatus !== activeOrder.painelStatus)
  const oldIndex = sameColumnOrders.findIndex((order) => order.id === orderId)
  const newIndex = sameColumnOrders.findIndex((order) => order.id === overId)

  if (oldIndex < 0 || newIndex < 0) return

  state.orders = [...otherOrders, ...arrayMove(sameColumnOrders, oldIndex, newIndex)]
  notifySubscribers()
}

export function queueOrderStatusSync(orderId: string, painelStatus: PainelStatus) {
  setOrderStatusInState(orderId, painelStatus)
  upsertPendingStatusUpdate(orderId, painelStatus)
  notifySubscribers()
}

export function queueOrderScheduleSync(orderId: string, painelStatus: PainelStatus, deliveryDatetime: string) {
  setOrderStatusInState(orderId, painelStatus, deliveryDatetime)
  upsertPendingStatusUpdate(orderId, painelStatus, deliveryDatetime)
  notifySubscribers()
}

export function updateBrowserOrder(order: Order) {
  const nextOrder = cloneOrders([order])[0]
  state.orders = state.orders.map((item) => (item.id === order.id ? nextOrder : item))
  notifySubscribers()
}

export function addBrowserOrder(order: Order) {
  const nextOrder = cloneOrders([order])[0]
  state.orders = [nextOrder, ...state.orders.filter((item) => item.id !== order.id)]
  notifySubscribers()
}

export function removeBrowserOrder(orderId: string) {
  state.orders = state.orders.filter((order) => order.id !== orderId)
  removePendingStatusUpdate(orderId)
  notifySubscribers()
}

export function useBrowserOrders(initialOrders: Order[], professionalId: string) {
  const [snapshot, setSnapshot] = useState(() => {
    if (professionalId && canUseBrowserStorage()) {
      const stored = readStoredSnapshot(professionalId)
      if (stored) {
        return {
          orders: cloneOrders(stored.orders),
          pendingStatusUpdates: Array.isArray(stored.pendingStatusUpdates)
            ? stored.pendingStatusUpdates.map((action) => ({ ...action }))
            : [],
          hydrated: true,
        }
      }
    }

    return {
      orders: cloneOrders(initialOrders),
      pendingStatusUpdates: [] as PendingStatusUpdate[],
      hydrated: false,
    }
  })

  useEffect(() => {
    if (!professionalId) {
      setSnapshot({
        orders: cloneOrders(initialOrders),
        pendingStatusUpdates: [],
        hydrated: false,
      })
      return
    }

    bootstrapBrowserOrders(professionalId, initialOrders)

    function syncState() {
      setSnapshot(getSnapshot())
    }

    listeners.add(syncState)
    syncState()

    return () => {
      listeners.delete(syncState)
    }
  }, [initialOrders, professionalId])

  return snapshot
}

"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { arrayMove } from '@dnd-kit/sortable'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { archiveOrder, updateOrderPainelStatus } from '@/app/pedidos/actions'
import { PainelCard } from '@/components/painel/PainelCard'
import { PainelColumn } from '@/components/painel/PainelColumn'
import { Order, PainelStatus, ProductType, PRODUCT_GROUPS, PRODUCT_SUBTYPES } from '@/lib/types'
import { Calendar, ChevronLeft, ChevronRight as ChevronRightIcon, X } from 'lucide-react'
import { useOrdersRealtimeRefresh } from '@/lib/realtime/use-orders-realtime-refresh'
import { playCuteSound, playCuteSoundOnce } from '@/lib/audio/cute-sounds'
import { composeProductSubtype, splitProductSubtype, toggleSelection } from '@/lib/product-subtype'
import { urgencyLevel } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { useProfessional } from '@/lib/context/ProfessionalContext'

const COLUMNS: { key: PainelStatus; title: string }[] = [
  { key: 'atendimento', title: 'Atendimento' },
  { key: 'agendado',    title: 'Agendado' },
  { key: 'preparando',  title: 'Preparando' },
  { key: 'pronto',      title: 'Pronto' },
  { key: 'entregue',    title: 'Entregue' },
  { key: 'cancelado',   title: 'Cancelado' },
]

const STATUS_ORDER: PainelStatus[] = ['atendimento', 'agendado', 'preparando', 'pronto', 'entregue', 'cancelado']

const DELIVERY_TAB_OFFSETS = [0, 1, 2, 3, 4, 5, 6, 7] as const
const URGENCY_ALERT_AUDIO_SRC = '/audio/alert.mp3'
const URGENCY_ALERT_REPEAT_MS = 2000
const URGENCY_ALERT_FADE_STEPS = 6
const URGENCY_ALERT_FADE_STEP_MS = 50

type DeliveryTabOffset = -1 | (typeof DELIVERY_TAB_OFFSETS)[number]

function sortOrdersByUnreadPriority(orders: Order[]) {
  return [...orders].sort((a, b) => {
    const aUnread = a.unreadClientMessagesCount ?? 0
    const bUnread = b.unreadClientMessagesCount ?? 0
    return bUnread - aUnread
  })
}

function padNumber(value: number) {
  return String(value).padStart(2, '0')
}

function toLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
}

function getDateKeyFromIso(isoValue: string | null | undefined) {
  if (!isoValue) return null

  const date = new Date(isoValue)
  if (Number.isNaN(date.getTime())) return null

  return toLocalDateKey(date)
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function getTabLabel(offset: DeliveryTabOffset, date: Date) {
  if (offset === -1) return 'Todos'
  if (offset === 0) return 'Hoje'
  if (offset === 1) return 'Amanhã'
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })
}

function getClientMessageIds(order: Order) {
  return order.messages
    .filter((message) => message.sender === 'client')
    .map((message) => message.id)
}

function hasUrgentRedOrder(order: Order) {
  if (order.painelStatus === 'pronto' || order.painelStatus === 'entregue' || order.painelStatus === 'cancelado') return false
  if (!order.deliveryDatetime) return false
  return urgencyLevel(order.deliveryDatetime) === 'vermelho'
}

interface PainelBoardProps {
  initialOrders: Order[]
  professionalId: string
}

export function PainelBoard({ initialOrders, professionalId }: PainelBoardProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>(() => initialOrders)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedDeliveryTab, setSelectedDeliveryTab] = useState<DeliveryTabOffset>(-1)
  const [schedulingId, setSchedulingId] = useState<string | null>(null)
  const [schedulingTargetStatus, setSchedulingTargetStatus] = useState<PainelStatus>('agendado')
  const [scheduleValue, setScheduleValue] = useState('')
  const [productType, setProductType] = useState<ProductType>('Bolo')
  const [productSubgroup, setProductSubgroup] = useState('')
  const [productVariations, setProductVariations] = useState<string[]>([])
  const [peopleCount, setPeopleCount] = useState<number>(0)
  const [totalPrice, setTotalPrice] = useState<number>(0)
  const [observations, setObservations] = useState('')
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  
  // Agora usamos o cache global do profissional
  const { tags: professionalTags } = useProfessional()
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef<{ id: string; fromStatus: PainelStatus; toStatus: PainelStatus } | null>(null)
  const dragSnapshotRef = useRef<Order[] | null>(null)
  const seenClientMessageIdsRef = useRef<Map<string, Set<string>>>(new Map())
  const hasHydratedMessageSoundsRef = useRef(false)
  const urgentAlertAudioRef = useRef<HTMLAudioElement | null>(null)
  const urgentAlertIntervalRef = useRef<number | null>(null)
  const urgentAlertFadeTimeoutRef = useRef<number | null>(null)

  useOrdersRealtimeRefresh(Boolean(activeId || schedulingId))

  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  function getScheduleSubtypeOptions(group: ProductType) {
    return professionalTags.subgroups[group] || PRODUCT_SUBTYPES[group] || []
  }

  function getScheduleVariationOptions(group: ProductType) {
    return professionalTags.variations[group] || []
  }

  useEffect(() => {
    if (!hasHydratedMessageSoundsRef.current) {
      const nextSnapshot = new Map<string, Set<string>>()
      initialOrders.forEach((order) => {
        nextSnapshot.set(order.id, new Set(getClientMessageIds(order)))
      })
      seenClientMessageIdsRef.current = nextSnapshot
      hasHydratedMessageSoundsRef.current = true
      return
    }

    const previousSnapshot = seenClientMessageIdsRef.current
    const nextSnapshot = new Map<string, Set<string>>()

    orders.forEach((order) => {
      const currentIds = getClientMessageIds(order)
      const currentIdSet = new Set(currentIds)
      const previousIds = previousSnapshot.get(order.id)

      if (previousIds) {
        currentIds.forEach((messageId) => {
          if (!previousIds.has(messageId)) {
            playCuteSoundOnce('receive', messageId)
          }
        })
      }

      nextSnapshot.set(order.id, currentIdSet)
    })

    seenClientMessageIdsRef.current = nextSnapshot
  }, [initialOrders, orders])

  function scrollKanban(direction: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: direction === 'right' ? 300 : -300, behavior: 'smooth' })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  )

  const activeOrder = activeId ? orders.find(o => o.id === activeId) : null
  const schedulingOrder = schedulingId ? orders.find((order) => order.id === schedulingId) : null

  const deliveryTabDates = useMemo(() => {
    const today = new Date()

    return DELIVERY_TAB_OFFSETS.map((offset) => {
      const date = addDays(today, offset)
      const dateKey = toLocalDateKey(date)
      const hasOrdersForDay = orders.some((order) => {
        if (order.painelStatus === 'atendimento') return false
        return getDateKeyFromIso(order.deliveryDatetime) === dateKey
      })

      return {
        offset,
        label: getTabLabel(offset, date),
        date,
        dateKey,
        hasOrdersForDay,
      }
    })
  }, [orders])

  const selectedDeliveryDateKey = useMemo(() => {
    if (selectedDeliveryTab < 0) return null

    const match = deliveryTabDates.find((item) => item.offset === selectedDeliveryTab)
    return match?.dateKey ?? null
  }, [deliveryTabDates, selectedDeliveryTab])

  const filteredOrders = useMemo(() => {
    if (!selectedDeliveryDateKey) return orders

    return orders.filter((order) => {
      if (order.painelStatus === 'atendimento') return true
      return getDateKeyFromIso(order.deliveryDatetime) === selectedDeliveryDateKey
    })
  }, [orders, selectedDeliveryDateKey])

  const hasUrgentRedOrders = useMemo(() => orders.some(hasUrgentRedOrder), [orders])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const audio = urgentAlertAudioRef.current ?? new Audio(URGENCY_ALERT_AUDIO_SRC)
    audio.preload = 'auto'
    audio.loop = false
    urgentAlertAudioRef.current = audio

    function clearFadeTimeout() {
      if (urgentAlertFadeTimeoutRef.current) {
        window.clearTimeout(urgentAlertFadeTimeoutRef.current)
        urgentAlertFadeTimeoutRef.current = null
      }
    }

    function stopAudioWithFadeOut() {
      if (urgentAlertIntervalRef.current) {
        window.clearInterval(urgentAlertIntervalRef.current)
        urgentAlertIntervalRef.current = null
      }

      clearFadeTimeout()

      const startVolume = Math.max(audio.volume || 1, 0.0001)
      let step = 0

      const fadeStep = () => {
        step += 1
        const nextVolume = Math.max(0, startVolume * (1 - step / URGENCY_ALERT_FADE_STEPS))
        audio.volume = nextVolume

        if (step >= URGENCY_ALERT_FADE_STEPS || nextVolume <= 0.0001) {
          audio.pause()
          audio.currentTime = 0
          audio.volume = 1
          urgentAlertFadeTimeoutRef.current = null
          return
        }

        urgentAlertFadeTimeoutRef.current = window.setTimeout(fadeStep, URGENCY_ALERT_FADE_STEP_MS)
      }

      fadeStep()
    }

    function playAudioClip() {
      audio.pause()
      audio.currentTime = 0
      audio.volume = 1
      void audio.play().catch(() => undefined)
    }

    if (!hasUrgentRedOrders) {
      return () => {
        stopAudioWithFadeOut()
      }
    }

    if (urgentAlertIntervalRef.current) return undefined

    playAudioClip()
    urgentAlertIntervalRef.current = window.setInterval(() => {
      playAudioClip()
    }, URGENCY_ALERT_REPEAT_MS)

    return () => {
      stopAudioWithFadeOut()
    }
  }, [hasUrgentRedOrders])

  function patchOrderInList(orderId: string, patch: Partial<Order>) {
    setOrders((current) => current.map((item) => (
      item.id === orderId
        ? { ...item, ...patch, updatedAt: new Date().toISOString() }
        : item
    )))
  }

  function reorderOrderInList(orderId: string, overId: string) {
    setOrders((current) => {
      const active = current.find((order) => order.id === orderId)
      const over = current.find((order) => order.id === overId)

      if (!active || !over || active.painelStatus !== over.painelStatus || orderId === overId) {
        return current
      }

      const sameColumnOrders = current.filter((order) => order.painelStatus === active.painelStatus)
      const otherOrders = current.filter((order) => order.painelStatus !== active.painelStatus)
      const oldIndex = sameColumnOrders.findIndex((order) => order.id === orderId)
      const newIndex = sameColumnOrders.findIndex((order) => order.id === overId)

      if (oldIndex < 0 || newIndex < 0) return current

      return [...otherOrders, ...arrayMove(sameColumnOrders, oldIndex, newIndex)]
    })
  }

  function restoreDragSnapshot() {
    if (!dragSnapshotRef.current) return
    setOrders(dragSnapshotRef.current)
    dragSnapshotRef.current = null
  }

  async function applyPainelChange(orderId: string, painelStatus: PainelStatus, deliveryDatetime?: string) {
    const result = await updateOrderPainelStatus(orderId, painelStatus, deliveryDatetime)

    if (result.success) {
      router.refresh()
      return true
    }

    return false
  }

  async function handleArchive(orderId: string) {
    const result = await archiveOrder(orderId)
    if (result.success) {
      router.refresh()
      return
    }

    throw new Error(result.error)
  }

  function toDatetimeLocalValue(date: Date) {
    const pad = (value: number) => String(value).padStart(2, '0')
    const year = date.getFullYear()
    const month = pad(date.getMonth() + 1)
    const day = pad(date.getDate())
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  function handleOpenSchedule(id: string, targetStatus: PainelStatus = 'agendado') {
    const order = orders.find((item) => item.id === id)
    if (!order) return

    const current = order.deliveryDatetime ? new Date(order.deliveryDatetime) : new Date()
    if (!Number.isNaN(current.getTime())) {
      if (!order.deliveryDatetime) {
        current.setHours(current.getHours() + 24)
        current.setMinutes(0, 0, 0)
      }
      setScheduleValue(toDatetimeLocalValue(current))
    } else {
      const fallback = new Date()
      fallback.setHours(fallback.getHours() + 24)
      fallback.setMinutes(0, 0, 0)
      setScheduleValue(toDatetimeLocalValue(fallback))
    }

    setSchedulingId(id)
    setSchedulingTargetStatus(targetStatus)
    setScheduleValue(toDatetimeLocalValue(current))
    const rawType = (order.productType as ProductType) || professionalTags.groups[0] || 'Bolo'
    const safeType = professionalTags.groups.includes(rawType as ProductType) ? (rawType as ProductType) : (professionalTags.groups[0] || 'Bolo')
    setProductType(safeType)

    const availableSubgroups = getScheduleSubtypeOptions(safeType)
    const availableVariations = getScheduleVariationOptions(safeType)
    const selectedTags = splitProductSubtype(order.productSubtype)
    const selectedSubgroup = selectedTags.find((item) => availableSubgroups.includes(item)) ?? availableSubgroups[0] ?? ''
    const selectedVariations = selectedTags.filter((item) => availableVariations.includes(item))

    setProductSubgroup(selectedSubgroup)
    setProductVariations(selectedVariations)
    setPeopleCount(order.peopleCount || 0)
    setTotalPrice(order.totalPrice || 0)
    setObservations(order.observations || '')
    setScheduleError(null)
  }

  async function handleConfirmSchedule() {
    if (!schedulingOrder) return
    if (!scheduleValue) {
      setScheduleError('Escolha uma data e hora para agendar.')
      return
    }

    const deliveryDatetime = new Date(scheduleValue).toISOString()
    const nextProductSubtype = productVariations.length > 0
      ? `${productSubgroup} · ${productVariations.join(', ')}`
      : productSubgroup

    if (!nextProductSubtype) {
      setScheduleError('Selecione ao menos uma linha.')
      return
    }
    
    // Atualiza localmente para feedback imediato
    patchOrderInList(schedulingOrder.id, {
      painelStatus: schedulingTargetStatus,
      deliveryDatetime,
      eventDate: deliveryDatetime,
      productType,
      productSubtype: nextProductSubtype,
      peopleCount,
      totalPrice,
      observations,
    })

    // Importar a action de updateOrder (vou assumir que ela está disponível via props ou import direto se necessário, 
    // mas aqui vou adaptar o applyPainelChange para usar a lógica completa se possível ou chamar direto)
    const { updateOrder } = await import('@/app/pedidos/actions')
    
    const result = await updateOrder(schedulingOrder.id, {
      productType,
      productSubtype: nextProductSubtype,
      peopleCount,
      deliveryDatetime: deliveryDatetime,
      deliveryType: schedulingOrder.deliveryType || 'entrega',
      observations,
      totalPrice,
      paymentMethod: schedulingOrder.payment?.method || 'pix',
      painelStatus: schedulingTargetStatus
    })

    if (result.success) {
      if (schedulingTargetStatus === 'pronto') {
        playCuteSound('ready')
      }
      router.refresh()
    } else {
      setScheduleError(result.error || 'Erro ao salvar informações.')
      return
    }

    setSchedulingId(null)
    setSchedulingTargetStatus('agendado')
    setScheduleValue('')
    setScheduleError(null)
  }

  function toggleScheduleVariation(variation: string) {
    setProductVariations((current) => toggleSelection(current, variation))
  }

  function handleCloseSchedule() {
    setSchedulingId(null)
    setSchedulingTargetStatus('agendado')
    setScheduleValue('')
    setScheduleError(null)
  }

  useEffect(() => {
    if (!schedulingOrder) return

    const availableSubgroups = getScheduleSubtypeOptions(productType)
    if (!availableSubgroups.includes(productSubgroup)) {
      setProductSubgroup(availableSubgroups[0] ?? '')
    }

    const availableVariations = getScheduleVariationOptions(productType)
    if (availableVariations.length === 0) {
      setProductVariations([])
      return
    }

    const nextSelection = productVariations.filter((variation) => availableVariations.includes(variation))
    if (nextSelection.length !== productVariations.length) {
      setProductVariations(nextSelection)
    }
  }, [productType, productSubgroup, productVariations, schedulingOrder])

  function handleAdvance(id: string) {
    const order = orders.find(o => o.id === id)
    if (!order) return
    const idx = STATUS_ORDER.indexOf(order.painelStatus)
    const next = STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.indexOf('entregue'))]
    patchOrderInList(id, { painelStatus: next })
    void applyPainelChange(id, next)
  }

  function handleCancel(id: string) {
    patchOrderInList(id, { painelStatus: 'cancelado' })
    void applyPainelChange(id, 'cancelado')
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
    const order = orders.find(o => o.id === active.id)
    if (order) {
      dragSnapshotRef.current = JSON.parse(JSON.stringify(orders)) as Order[]
      dragStateRef.current = { id: active.id as string, fromStatus: order.painelStatus, toStatus: order.painelStatus }
    }
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || !dragStateRef.current) return
    const drag = dragStateRef.current

    const overColumnKey = COLUMNS.find(c => c.key === over.id)?.key
    if (overColumnKey) {
      if (overColumnKey !== drag.toStatus) {
        drag.toStatus = overColumnKey
        patchOrderInList(active.id as string, { painelStatus: overColumnKey })
      }
      return
    }

    const overOrder = orders.find(o => o.id === over.id)
    const activeOrder = orders.find(o => o.id === active.id)
    if (!activeOrder || !overOrder) return

    if (activeOrder.painelStatus !== overOrder.painelStatus) {
      drag.toStatus = overOrder.painelStatus
      patchOrderInList(active.id as string, { painelStatus: overOrder.painelStatus })
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const drag = dragStateRef.current
    dragStateRef.current = null
    setActiveId(null)

    if (!over) {
      if (drag) {
        restoreDragSnapshot()
      }
      return
    }

    if (drag && drag.fromStatus === 'atendimento' && drag.toStatus !== drag.fromStatus) {
      restoreDragSnapshot()
      handleOpenSchedule(drag.id, drag.toStatus)
      return
    }

    if (drag && drag.toStatus !== drag.fromStatus) {
      const previous = dragSnapshotRef.current
      void applyPainelChange(drag.id, drag.toStatus).then((success) => {
        if (!success && previous) {
          setOrders(previous)
        } else if (success && drag.toStatus === 'pronto') {
          playCuteSound('ready')
        }
      })
    } else {
      reorderOrderInList(active.id as string, over.id as string)
    }

    dragSnapshotRef.current = null
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-fuchsia-500/20 via-white/5 to-violet-500/15 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_42%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.28em] text-gray-200">
                Gestão de pedidos
              </div>
              <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:gap-6">
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">Painel</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDeliveryTab(-1)}
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                      selectedDeliveryTab === -1
                        ? 'border-emerald-300/70 bg-emerald-400/20 text-emerald-50 shadow-[0_0_0_1px_rgba(110,231,183,0.22)]'
                        : 'border-white/10 bg-black/15 text-gray-300 hover:border-white/20 hover:bg-white/8'
                    }`}
                  >
                    Todos
                  </button>
                  {deliveryTabDates.slice(0, 3).map((tab) => {
                    const isSelected = selectedDeliveryTab === tab.offset
                    const hasOrdersForDay = tab.hasOrdersForDay

                    return (
                      <button
                        key={tab.offset}
                        type="button"
                        onClick={() => setSelectedDeliveryTab(tab.offset)}
                        className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          isSelected
                            ? 'border-emerald-300/70 bg-emerald-400/20 text-emerald-50 shadow-[0_0_0_1px_rgba(110,231,183,0.22)]'
                            : hasOrdersForDay
                              ? 'border-emerald-400/30 bg-emerald-500/12 text-emerald-100 hover:border-emerald-300/55 hover:bg-emerald-400/18'
                              : 'border-white/10 bg-black/15 text-gray-300 hover:border-white/20 hover:bg-white/8'
                        }`}
                      >
                        <span>{tab.label}</span>
                        {hasOrdersForDay && (
                          <span className={`ml-2 inline-flex h-2 w-2 rounded-full ${isSelected ? 'bg-emerald-100' : 'bg-emerald-300'}`} />
                        )}
                      </button>
                    )
                  })}
                </div>
                <div className="max-w-full overflow-x-auto pb-1">
                  <div className="flex w-max items-center gap-2 pr-2">
                    {deliveryTabDates.slice(2).map((tab) => {
                      const isSelected = selectedDeliveryTab === tab.offset
                      const hasOrdersForDay = tab.hasOrdersForDay

                      return (
                        <button
                          key={tab.offset}
                          type="button"
                          onClick={() => setSelectedDeliveryTab(tab.offset)}
                          className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                            isSelected
                              ? 'border-emerald-300/70 bg-emerald-400/20 text-emerald-50 shadow-[0_0_0_1px_rgba(110,231,183,0.22)]'
                              : hasOrdersForDay
                                ? 'border-emerald-400/30 bg-emerald-500/12 text-emerald-100 hover:border-emerald-300/55 hover:bg-emerald-400/18'
                                : 'border-white/10 bg-black/15 text-gray-300 hover:border-white/20 hover:bg-white/8'
                          }`}
                        >
                          <span>{tab.label}</span>
                          {hasOrdersForDay && (
                            <span className={`ml-2 inline-flex h-2 w-2 rounded-full ${isSelected ? 'bg-emerald-100' : 'bg-emerald-300'}`} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 px-3 py-1 text-rose-200"><span className="inline-block w-2 h-2 rounded-full bg-rose-500 shrink-0" /> Urgente &lt;2h</span>
              <span className="flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-amber-200"><span className="inline-block w-2 h-2 rounded-full bg-amber-400 shrink-0" /> Próximo 2–12h</span>
            </div>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl p-8 sm:p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-3xl">
            📭
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-white">Nenhum pedido ainda</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-300">
            Quando houver pedidos, eles aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={() => scrollKanban('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-16 rounded-r-xl border border-white/10 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-gray-100 shadow-xl transition-colors"
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={() => scrollKanban('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-16 rounded-l-xl border border-white/10 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-gray-100 shadow-xl transition-colors"
            aria-label="Rolar para direita"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>

          <div ref={scrollRef} className="overflow-x-auto pb-2 select-none px-10" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 pb-4 w-max min-w-full">
                {COLUMNS.map(col => {
                  const items = sortOrdersByUnreadPriority(filteredOrders.filter(o => o.painelStatus === col.key))
                  const hasUnreadMessages = items.some((order) => (order.unreadClientMessagesCount ?? 0) > 0)
                  return (
                    <PainelColumn
                      key={col.key}
                      id={col.key}
                      title={col.title}
                      count={items.length}
                      hasUnreadMessages={hasUnreadMessages}
                      itemIds={items.map(o => o.id)}
                    >
                      {items.map(o => (
                        <PainelCard
                          key={o.id}
                          order={o}
                          professionalId={professionalId}
                          onAdvance={handleAdvance}
                          onSchedule={handleOpenSchedule}
                          onCancel={handleCancel}
                          onArchive={handleArchive}
                        />
                      ))}
                    </PainelColumn>
                  )
                })}
              </div>

              <DragOverlay>
                {activeOrder ? (
                  <div className="opacity-90 rotate-1 scale-105">
                    <PainelCard
                      order={activeOrder}
                      professionalId={professionalId}
                      onAdvance={() => {}}
                      onSchedule={() => {}}
                      onCancel={() => {}}
                      onArchive={async () => {}}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      )}

      {schedulingOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 py-6 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#111111] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-gray-400">Agendamento</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Agendar pedido</h2>
                <p className="mt-1 text-sm text-gray-300">{schedulingOrder.clientName}</p>
              </div>
              <button onClick={handleCloseSchedule} className="rounded-full p-2 text-gray-400 hover:bg-white/5 hover:text-white" aria-label="Fechar modal de agendamento">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-5 space-y-4">
              <div className="space-y-4">
                {/* Data e Hora */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <Calendar className="h-4 w-4 text-amber-400" />
                    Data e Hora da Entrega
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleValue}
                    onChange={(e) => setScheduleValue(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Produto e Subtipo */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-400 px-1">Categoria</label>
                    <select
                      value={productType}
                      onChange={(e) => {
                        const newType = e.target.value as ProductType
                        setProductType(newType)
                        const nextSubgroups = getScheduleSubtypeOptions(newType)
                        const nextVariations = getScheduleVariationOptions(newType)
                        setProductSubgroup(nextSubgroups[0] ?? '')
                        setProductVariations(nextVariations)
                      }}
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-white/20 appearance-none"
                    >
                      {professionalTags.groups.map(group => (
                        <option key={group} value={group} className="bg-[#111] text-white">{group}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-400 px-1">Linha</label>
                    <select
                      value={productSubgroup}
                      onChange={(e) => setProductSubgroup(e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-white/20 appearance-none"
                    >
                      {getScheduleSubtypeOptions(productType).map((sub) => (
                        <option key={sub} value={sub} className="bg-[#111] text-white">{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-400 px-1">Variações</label>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2 space-y-1">
                      {getScheduleVariationOptions(productType).length > 0 ? (
                        getScheduleVariationOptions(productType).map((variation) => {
                          const selected = productVariations.includes(variation)

                          return (
                            <label
                              key={variation}
                              className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition ${selected ? 'bg-emerald-500/15 text-white' : 'text-gray-200 hover:bg-white/5'}`}
                            >
                              <span>{variation}</span>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleScheduleVariation(variation)}
                                className="h-4 w-4 rounded border-white/20 bg-black/40 text-emerald-500 focus:ring-emerald-500"
                              />
                            </label>
                          )
                        })
                      ) : (
                        <p className="px-3 py-3 text-sm text-gray-400">
                          Nenhuma variação salva para este tipo de produto. Cadastre as variações na página Produtos.
                        </p>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 px-1">Selecione uma ou mais opções salvas.</p>
                  </div>
                </div>

                {/* Pessoas e Valor */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-400 px-1">Qtd Pessoas</label>
                    <input
                      type="number"
                      value={peopleCount || ''}
                      onChange={(e) => setPeopleCount(Number(e.target.value))}
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-400 px-1">Valor Total (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={totalPrice || ''}
                      onChange={(e) => setTotalPrice(Number(e.target.value))}
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400 px-1">Observações do Pedido</label>
                  <textarea
                    rows={3}
                    placeholder="Algum detalhe adicional..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                  />
                </div>
              </div>

              {scheduleError && <p className="text-xs text-rose-300 px-1 font-medium">{scheduleError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCloseSchedule}
                  className="flex-1 h-12 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-gray-200 hover:bg-white/10 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirmSchedule}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-sm font-bold text-black hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-900/20 transition-all active:scale-[0.98]"
                >
                  Salvar e Agendar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

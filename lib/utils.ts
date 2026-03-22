import { Order, OrderBucket, UrgencyLevel } from './types'

export function fmtTimeShort(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function fmtDateShort(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function daysDiff(a: Date, b: Date) {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export function classifyOrderBucket(o: Order): OrderBucket {
  if (o.status === 'finalizado') return 'finalizado'
  if (o.status === 'cancelado') return 'cancelado'
  if (o.status === 'nao_confirmado') return 'atendimento'

  const today = startOfDay(new Date())
  const d = startOfDay(new Date(o.eventDate))
  const diff = daysDiff(d, today) // positive if event >= today

  if (diff === 0) return 'urgente'
  if (diff === 1) return 'proximo'
  if (diff >= 2) return 'planejado'

  // evento passado mas não finalizado -> tratar como urgente para destaque
  return 'urgente'
}

export function bucketColor(bucket: OrderBucket) {
  switch (bucket) {
    case 'atendimento':
      return 'border-l-4 border-blue-400'
    case 'planejado':
      return 'border-l-4 border-lime-400'
    case 'proximo':
      return 'border-l-4 border-amber-400'
    case 'urgente':
      return 'border-l-4 border-rose-500'
    case 'finalizado':
      return 'border-l-4 border-zinc-400'
    case 'cancelado':
      return 'border-l-4 border-neutral-900'
  }
}

export function bucketLabel(bucket: OrderBucket) {
  switch (bucket) {
    case 'atendimento':
      return 'Atendimento'
    case 'planejado':
      return 'Planejado'
    case 'proximo':
      return 'Próximo'
    case 'urgente':
      return 'Urgente'
    case 'finalizado':
      return 'Finalizado'
    case 'cancelado':
      return 'Cancelado'
  }
}

export function urgencyLevel(deliveryIso: string): UrgencyLevel {
  const diffMs = new Date(deliveryIso).getTime() - Date.now()
  const diffH = diffMs / (1000 * 60 * 60)
  if (diffH < 2) return 'vermelho'
  if (diffH < 24) return 'laranja'
  return 'verde'
}

export function urgencyBorderClass(deliveryIso: string): string {
  const level = urgencyLevel(deliveryIso)
  if (level === 'vermelho') return 'border-l-4 border-rose-500'
  if (level === 'laranja') return 'border-l-4 border-amber-400'
  return 'border-l-4 border-lime-400'
}

export function urgencyBgClass(deliveryIso: string): string {
  const level = urgencyLevel(deliveryIso)
  if (level === 'vermelho') return 'bg-gray-900/90 border border-white/10 border-l-[5px] border-l-rose-500'
  if (level === 'laranja') return 'bg-gray-900/90 border border-white/10 border-l-[5px] border-l-amber-400'
  return 'bg-gray-900/90 border border-white/10 border-l-[5px] border-l-emerald-400'
}


export function urgencyBadgeClass(deliveryIso: string): string {
  const level = urgencyLevel(deliveryIso)
  if (level === 'vermelho') return 'bg-rose-500/20 text-rose-400'
  if (level === 'laranja') return 'bg-amber-400/20 text-amber-400'
  return 'bg-lime-400/20 text-lime-400'
}

export function urgencyLabel(deliveryIso: string): string {
  const level = urgencyLevel(deliveryIso)
  if (level === 'vermelho') return 'Urgente'
  if (level === 'laranja') return 'Próximo'
  return 'Agendado'
}

export function painelStatusLabel(status: import('./types').PainelStatus): string {
  switch (status) {
    case 'atendimento': return 'Atendimento'
    case 'agendado':    return 'Agendado'
    case 'preparando':  return 'Preparando'
    case 'pronto':      return 'Pronto'
    case 'entregue':    return 'Entregue'
    case 'cancelado':   return 'Cancelado'
  }
}

export function fmtDatetime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

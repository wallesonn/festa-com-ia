import { Order, OrderBucket } from './types'

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
      return 'border-l-4 border-blue-500'
    case 'planejado':
      return 'border-l-4 border-green-500'
    case 'proximo':
      return 'border-l-4 border-orange-500'
    case 'urgente':
      return 'border-l-4 border-red-500'
    case 'finalizado':
      return 'border-l-4 border-gray-300'
    case 'cancelado':
      return 'border-l-4 border-black'
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

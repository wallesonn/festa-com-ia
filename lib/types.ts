export type ConversationStatus = 'nova' | 'em_atendimento' | 'aguardando' | 'finalizada'

export interface Conversation {
  id: string
  clientName: string
  lastMessage: string
  timestamp: string // ISO
  status: ConversationStatus
}

export type ProductType = 'Bolo' | 'Doces' | 'Salgados' | 'Kit Festa'

export type OrderStatus = 'em_andamento' | 'finalizado' | 'cancelado' | 'nao_confirmado'

export type OrderBucket = 'atendimento' | 'planejado' | 'proximo' | 'urgente' | 'finalizado' | 'cancelado'

export interface Order {
  id: string
  clientName: string
  productType: ProductType
  eventDate: string // ISO date
  peopleCount: number
  status: OrderStatus
}

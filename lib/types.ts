export type ConversationStatus = 'nova' | 'em_atendimento' | 'aguardando' | 'finalizada'

export interface Conversation {
  id: string
  clientName: string
  lastMessage: string
  timestamp: string // ISO
  status: ConversationStatus
}

export type ProductType = 'Bolo' | 'Doces' | 'Salgados' | 'Kit Festa'

export const PRODUCT_SUBTYPES: Record<ProductType, string[]> = {
  'Bolo':      ['Chocolate', 'Red Velvet', 'Morango', 'Limão', 'Baunilha'],
  'Doces':     ['Brigadeiro', 'Beijinho', 'Bicho-de-pé', 'Cajuzinho', 'Palha Italiana'],
  'Salgados':  ['Coxinha', 'Enroladinho', 'Mini-quiche', 'Kibe', 'Bolinha de Queijo'],
  'Kit Festa': ['Kids', 'Adulto', 'Temático', 'Simples', 'Premium'],
}

export type OrderStatus = 'em_andamento' | 'finalizado' | 'cancelado' | 'nao_confirmado'

export type OrderBucket = 'atendimento' | 'planejado' | 'proximo' | 'urgente' | 'finalizado' | 'cancelado'

export type PainelStatus = 'atendimento' | 'agendado' | 'preparando' | 'pronto' | 'entregue' | 'cancelado'

export type UrgencyLevel = 'verde' | 'laranja' | 'vermelho'

export type MessageSender = 'client' | 'attendant'

export interface ChatMessage {
  id: string
  sender: MessageSender
  text: string
  at: string // ISO
}

export interface Order {
  productSubtype: string
  id: string
  clientName: string
  productType: ProductType
  eventDate: string // ISO date (legacy)
  deliveryDatetime: string // ISO datetime (data+hora da entrega)
  peopleCount: number
  status: OrderStatus
  painelStatus: PainelStatus
  lastMessage: string
  lastMessageAt: string // ISO
  messages: ChatMessage[]
}

// ─── Conversation ────────────────────────────────────────────────────────────

export type ConversationStatus = 'nova' | 'em_atendimento' | 'aguardando' | 'finalizada'

export interface Conversation {
  id: string
  clientId: string
  clientName: string
  clientPhone: string
  lastMessage: string
  timestamp: string // ISO
  status: ConversationStatus
  channel: 'whatsapp' | 'instagram' | 'manual'
  unreadCount: number
}

// ─── Product ─────────────────────────────────────────────────────────────────

export type ProductType = 'Bolo' | 'Doces' | 'Salgados' | 'Refeição'

export const PRODUCT_GROUPS: ProductType[] = ['Bolo', 'Doces', 'Salgados', 'Refeição']

export const PRODUCT_SUBTYPES: Record<ProductType, string[]> = {
  'Bolo':      ['Chocolate', 'Red Velvet', 'Morango', 'Limão', 'Baunilha'],
  'Doces':     ['Brigadeiro', 'Beijinho', 'Bicho-de-pé', 'Cajuzinho', 'Palha Italiana'],
  'Salgados':  ['Coxinha', 'Enroladinho', 'Mini-quiche', 'Kibe', 'Bolinha de Queijo'],
  'Refeição':  ['Feijoada', 'Torta', 'Lasanha', 'Prato executivo', 'Arroz carreteiro'],
}

export interface Ingredient {
  name: string
  quantity: string  // ex: "200g", "3 unidades", "1 xícara"
  unit: string      // ex: "g", "ml", "un", "xícara"
  costPerUnit: number // R$ por unidade
}

export interface Product {
  id: string
  name: string           // ex: "Bolo Red Velvet"
  type: ProductType
  subtype: string
  description: string
  basePrice: number      // R$ preço base (sem servings)
  pricePerPerson: number // R$ adicional por pessoa
  minPeople: number
  maxPeople: number
  prepTimeHours: number  // horas de preparo
  shelfLifeDays: number  // validade em dias
  ingredients: Ingredient[]
  allergens: string[]    // ex: ['glúten', 'lactose', 'nozes']
  available: boolean
  imageEmoji: string
}

// ─── Client ──────────────────────────────────────────────────────────────────

export interface Address {
  street: string     // ex: "Rua das Flores, 123"
  neighborhood: string
  city: string
  state: string
  zipCode: string
  complement?: string // ex: "Apto 42"
  reference?: string  // ex: "Próximo ao mercado"
}

export type ClientSource = 'whatsapp' | 'instagram' | 'indicação' | 'site' | 'outro'

export interface Client {
  id: string
  name: string
  phone: string        // ex: "+55 11 99999-9999"
  email?: string
  address?: Address
  source: ClientSource // como conheceu
  notes: string        // observações gerais (alergias, preferências)
  totalOrders: number
  totalSpent: number   // R$
  lastOrderAt?: string // ISO
  createdAt: string    // ISO
  tags: string[]       // ex: ['vip', 'alérgico a nozes', 'aniversário recorrente']
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'transferencia'
export type PaymentStatus = 'pendente' | 'parcial' | 'pago' | 'estornado'

export interface Payment {
  id: string
  orderId: string
  method: PaymentMethod
  status: PaymentStatus
  totalAmount: number    // R$ valor total do pedido
  paidAmount: number     // R$ já pago
  dueAmount: number      // R$ restante
  depositPercent: number // % de sinal (ex: 50)
  depositPaidAt?: string // ISO — quando o sinal foi pago
  fullPaidAt?: string    // ISO — quando quitou
  notes?: string
}

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'em_andamento' | 'finalizado' | 'cancelado' | 'nao_confirmado'

export type OrderBucket = 'atendimento' | 'planejado' | 'proximo' | 'urgente' | 'finalizado' | 'cancelado'

export type PainelStatus = 'atendimento' | 'agendado' | 'preparando' | 'pronto' | 'entregue' | 'cancelado'

export type UrgencyLevel = 'neutro' | 'laranja' | 'vermelho'

export type DeliveryType = 'entrega' | 'retirada'

export type MessageSender = 'client' | 'attendant'

export interface ChatMessage {
  id: string
  sender: MessageSender
  text: string
  at: string // ISO
  suggestions?: string[] // sugestões geradas pelo n8n (apenas em mensagens do cliente)
}

export interface Order {
  id: string
  clientId: string
  clientName: string
  clientPhone: string
  productType: ProductType
  productSubtype: string
  productId?: string       // ref ao catálogo quando existir
  eventDate: string        // ISO date — data do evento
  deliveryDatetime: string // ISO datetime — data+hora da entrega/retirada
  deliveryType: DeliveryType
  deliveryAddress?: Address
  peopleCount: number
  observations: string     // alergias, preferências, detalhes
  internalNotes: string    // notas internas da equipe
  totalPrice: number       // R$
  status: OrderStatus
  painelStatus: PainelStatus
  payment: Payment
  lastMessage: string
  lastMessageAt: string    // ISO
  messages: ChatMessage[]
  createdAt: string        // ISO
  updatedAt: string        // ISO
}

// ─── Appointment / Agenda ────────────────────────────────────────────────────

export type AppointmentType = 'producao' | 'entrega' | 'retirada' | 'reuniao' | 'compras'

export interface Appointment {
  id: string
  orderId?: string
  clientName?: string
  type: AppointmentType
  title: string
  description: string
  scheduledAt: string  // ISO datetime
  durationMinutes: number
  confirmed: boolean
  color: string        // hex ou classe Tailwind
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType = 'novo_pedido' | 'mensagem' | 'entrega_proxima' | 'pagamento' | 'alerta'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  createdAt: string // ISO
  orderId?: string
  clientId?: string
}

// ─── Business Config ─────────────────────────────────────────────────────────

export interface BusinessHours {
  day: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'
  open: string   // "09:00"
  close: string  // "18:00"
  closed: boolean
}

export interface BusinessConfig {
  name: string
  phone: string
  email: string
  instagram?: string
  address: Address
  businessHours: BusinessHours[]
  deliveryRadiusKm: number
  deliveryFeePerKm: number  // R$
  minOrderValue: number     // R$
  defaultDepositPercent: number
  minAdvanceHours: number   // horas mínimas de antecedência
  pixKey: string
  welcomeMessage: string    // msg automática de boas-vindas
}

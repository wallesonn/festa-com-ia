import { ChatMessage, Conversation, ConversationStatus, Order, OrderStatus, PainelStatus, ProductType, PRODUCT_SUBTYPES } from './types'

const names = [
  'Maria Souza','João Santos','Ana Paula','Pedro Henrique','Carla Mendes','Lucas Lima','Fernanda Alves','Rafael Gomes','Juliana Rocha','Bruno Costa','Mariana Ribeiro','Felipe Araujo','Aline Nunes','Daniela Freitas','Thiago Martins'
]

const pick = <T,>(arr: readonly T[], seed: number): T => arr[seed % arr.length]

const productTypes: ProductType[] = ['Bolo','Doces','Salgados','Refeição']

const baseMessages = [
  'Quanto custa um bolo para 20 pessoas?','Vocês fazem brigadeiro gourmet?','Qual o prazo para encomenda de salgados?','Tem disponibilidade para sábado?','Quais sabores de bolo vocês têm?','Aceitam Pix?','Entrega no bairro Centro?','Preciso de uma refeição para 30 pessoas.'
]

const threadTemplates: [string, string][][] = [
  [
    ['client','Oi, queria encomendar um bolo de chocolate para 30 pessoas.'],
    ['attendant','Olá! Claro, temos várias opções. Qual a data do evento?'],
    ['client','É no próximo sábado, dia 22.'],
    ['attendant','Ótimo! Vou verificar nossa agenda e já te confirmo.'],
    ['client','Perfeito, aguardo. Aceitam Pix?'],
  ],
  [
    ['client','Bom dia! Vocês fazem brigadeiro gourmet?'],
    ['attendant','Bom dia! Fazemos sim, com vários recheios.'],
    ['client','Queria umas 80 unidades para uma festa.'],
    ['attendant','Sem problema. Qual a data e horário da entrega?'],
    ['client','Sábado às 16h, pode ser?'],
  ],
  [
    ['client','Olá, qual o prazo mínimo para encomendar salgados?'],
    ['attendant','Trabalhamos com 3 dias úteis de antecedência.'],
    ['client','Ok, então quero pedir para quinta-feira.'],
    ['attendant','Perfeito! Quantas unidades você precisa?'],
    ['client','Umas 150 unidades, meio a meio assados e fritos.'],
  ],
  [
    ['client','Tem disponibilidade para sábado que vem?'],
    ['attendant','Deixa eu verificar... temos sim! O que você precisa?'],
    ['client','Uma refeição completa para 25 pessoas.'],
    ['attendant','Posso te sugerir opções como feijoada, torta ou lasanha. Quer um orçamento?'],
    ['client','Sim por favor, me manda o valor.'],
  ],
  [
    ['client','Quais sabores de bolo vocês têm?'],
    ['attendant','Temos chocolate, red velvet, limão, morango e baunilha.'],
    ['client','Adorei! Quero o de morango com cobertura de chantilly.'],
    ['attendant','Ótima escolha! Para quantas pessoas seria?'],
    ['client','Para 20 pessoas, aniversário da minha filha.'],
  ],
]

function generateMessages(orderId: string): ChatMessage[] {
  const thread = threadTemplates[parseInt(orderId.replace(/\D/g, '')) % threadTemplates.length]
  const now = Date.now()
  return thread.map(([ sender, text ], i) => ({
    id: `${orderId}-m${i}`,
    sender: sender as 'client' | 'attendant',
    text,
    at: new Date(now - (thread.length - i) * 8 * 60 * 1000).toISOString(),
  }))
}

export function generateSuggestions(message: string): string[] {
  const m = message.toLowerCase()
  if (m.includes('bolo')) return [
    'Para quantas pessoas seria o bolo?',
    'Você já tem uma data para o evento?',
    'Qual sabor você prefere?'
  ]
  if (m.includes('doce') || m.includes('brigadeiro')) return [
    'Tem preferência por tipos de doces?',
    'Qual a quantidade aproximada?',
    'Alguma restrição alimentar?'
  ]
  if (m.includes('salgad')) return [
    'Qual o número de convidados?',
    'Assados, fritos ou misto?',
    'Tem data definida para o evento?'
  ]
  if (m.includes('entrega')) return [
    'Qual o endereço da entrega?',
    'Qual o horário desejado?',
    'Podemos calcular a taxa para sua região.'
  ]
  if (m.includes('preço') || m.includes('custa') || m.includes('valor')) return [
    'Qual é a quantidade/pessoas?',
    'Tem alguma preferência de sabor?',
    'Qual a data do evento?'
  ]
  if (m.includes('data') || m.includes('sábado') || m.includes('sabado')) return [
    'Qual o horário estimado do evento?',
    'Quantidade de pessoas?',
    'Deseja entrega ou retirada?'
  ]
  return [
    'Pode me contar mais detalhes do pedido?',
    'Qual a data do evento?',
    'Tem alguma preferência de sabores?'
  ]
}

function randomFutureDate(daysAheadMin = 0, daysAheadMax = 10) {
  const now = new Date()
  const delta = Math.floor(Math.random() * (daysAheadMax - daysAheadMin + 1)) + daysAheadMin
  const d = new Date(now)
  d.setDate(now.getDate() + delta)
  d.setHours(14, 0, 0, 0)
  return d.toISOString()
}

// Gera data/hora de entrega espalhada para cobrir os níveis de urgência no mock
const deliveryOffsets = [
  // vermelho: < 2h
  30, 60, 90,
  // laranja: 2h-12h
  3 * 60, 6 * 60, 9 * 60,
  // neutro: >= 12h
  12 * 60, 18 * 60,
  36 * 60, 48 * 60, 72 * 60, 5 * 24 * 60, 7 * 24 * 60,
]

const phones = [
  '+55 11 91234-5678','+55 21 98765-4321','+55 31 97654-3210','+55 41 96543-2109',
  '+55 51 95432-1098','+55 61 94321-0987','+55 71 93210-9876','+55 81 92109-8765',
  '+55 11 91098-7654','+55 21 90987-6543','+55 31 99876-5432','+55 41 98765-4321',
]

const conversationStatuses: ConversationStatus[] = ['nova', 'em_atendimento', 'aguardando', 'finalizada']
const channels = ['whatsapp', 'instagram', 'manual'] as const
const tsOffsets = [10, 30, 60, 90, 120, 180, 240, 300, 360, 420, 480, 540]
const unreadCounts = [1, 2, 3, 4, 5, 1, 2, 3, 1, 2, 4, 5]

export const conversations: Conversation[] = Array.from({ length: 12 }).map((_, i) => {
  const name = names[i % names.length]
  const msg = pick(baseMessages, i * 3)
  const status: ConversationStatus = pick(conversationStatuses, i)
  const channel = pick(channels, i * 2)
  const ts = new Date('2026-03-22T10:00:00Z')
  ts.setMinutes(ts.getMinutes() - tsOffsets[i % tsOffsets.length])
  return {
    id: `c${i + 1}`,
    clientId: `cl${i + 1}`,
    clientName: name,
    clientPhone: phones[i % phones.length],
    lastMessage: msg,
    timestamp: ts.toISOString(),
    status,
    channel,
    unreadCount: status === 'nova' ? unreadCounts[i % unreadCounts.length] : 0,
  }
})

const painelStatuses: PainelStatus[] = ['atendimento', 'agendado', 'preparando', 'pronto', 'entregue', 'cancelado']

const peopleCounts = [10, 15, 20, 25, 30, 40, 50]
const observationsSamples = [
  'Alergia a nozes. Prefere entrega no período da manhã.',
  'Sem restrições. Pagamento 50% sinal, 50% na entrega.',
  'Vegetariana — sem ingredientes de origem animal nos salgados.',
  'Intolerante a lactose. Confirmar ingredientes da cobertura.',
  'Cliente VIP — desconto de 10% já aplicado.',
  'Aniversário surpresa, não mencionar o nome do bolo na embalagem.',
  'Retirada no local às 14h. Confirmar 1h antes.',
  'Produto para evento corporativo — nota fiscal necessária.',
]

const orderStatuses: OrderStatus[] = ['em_andamento', 'finalizado', 'cancelado', 'nao_confirmado']
const paymentMethods = ['pix', 'cartao_credito', 'dinheiro'] as const
const BASE_DATE = new Date('2026-03-22T12:00:00Z').getTime()
const msgOffsets = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105, 115]
const priceSurplus = [12, 27, 8, 43, 19, 35, 6, 48, 22, 31, 14, 39]

export const orders: Order[] = Array.from({ length: 12 }).map((_, i) => {
  const name = names[(i * 2) % names.length]
  const product = pick(productTypes, i * 3)
  const status: OrderStatus = pick(orderStatuses, i)
  const painelStatus: PainelStatus = painelStatuses[i % painelStatuses.length]
  const offsetMinutes = deliveryOffsets[i % deliveryOffsets.length]
  const deliveryDt = new Date(BASE_DATE + offsetMinutes * 60 * 1000)
  const msg = pick(baseMessages, i * 2)
  const msgAt = new Date(BASE_DATE - msgOffsets[i % msgOffsets.length] * 60 * 1000)
  const people = peopleCounts[i % peopleCounts.length]
  const totalPrice = parseFloat((80 + people * 4.5 + priceSurplus[i % priceSurplus.length]).toFixed(2))
  const paidAmount = status === 'finalizado' ? totalPrice : parseFloat((totalPrice * 0.5).toFixed(2))
  const orderId = `o${i + 1}`
  const createdAt = new Date(BASE_DATE - (i + 1) * 24 * 60 * 60 * 1000).toISOString()
  return {
    id: orderId,
    clientId: `cl${(i % 12) + 1}`,
    clientName: name,
    clientPhone: phones[i % phones.length],
    productType: product,
    productSubtype: pick(PRODUCT_SUBTYPES[product], i * 7),
    eventDate: deliveryDt.toISOString(),
    deliveryDatetime: deliveryDt.toISOString(),
    deliveryType: i % 3 === 0 ? 'retirada' : 'entrega',
    peopleCount: people,
    observations: pick(observationsSamples, i),
    internalNotes: i % 4 === 0 ? 'Verificar disponibilidade de ingredientes.' : '',
    totalPrice,
    status,
    painelStatus,
    payment: {
      id: `pay${i + 1}`,
      orderId,
      method: pick(paymentMethods, i * 5),
      status: status === 'finalizado' ? 'pago' : status === 'cancelado' ? 'estornado' : 'parcial',
      totalAmount: totalPrice,
      paidAmount,
      dueAmount: parseFloat((totalPrice - paidAmount).toFixed(2)),
      depositPercent: 50,
      depositPaidAt: createdAt,
      fullPaidAt: status === 'finalizado' ? deliveryDt.toISOString() : undefined,
    },
    lastMessage: msg,
    lastMessageAt: msgAt.toISOString(),
    messages: generateMessages(orderId),
    createdAt,
    updatedAt: msgAt.toISOString(),
  }
})

export function getConversations() { return conversations }
export function getOrders() { return orders }

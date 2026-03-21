import { Conversation, ConversationStatus, Order, OrderStatus, ProductType } from './types'

const names = [
  'Maria Souza','João Santos','Ana Paula','Pedro Henrique','Carla Mendes','Lucas Lima','Fernanda Alves','Rafael Gomes','Juliana Rocha','Bruno Costa','Mariana Ribeiro','Felipe Araujo','Aline Nunes','Daniela Freitas','Thiago Martins'
]

const sample = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

const productTypes: ProductType[] = ['Bolo','Doces','Salgados','Kit Festa']

const baseMessages = [
  'Quanto custa um bolo para 20 pessoas?','Vocês fazem brigadeiro gourmet?','Qual o prazo para encomenda de salgados?','Tem disponibilidade para sábado?','Quais sabores de bolo vocês têm?','Aceitam Pix?','Entrega no bairro Centro?','Preciso de um kit festa para 30 pessoas.'
]

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
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

export const conversations: Conversation[] = Array.from({ length: 12 }).map((_, i) => {
  const name = names[i % names.length]
  const msg = sample(baseMessages)
  const status: ConversationStatus = sample(['nova', 'em_atendimento', 'aguardando', 'finalizada'])
  const ts = new Date()
  ts.setMinutes(ts.getMinutes() - Math.floor(Math.random() * 600))
  return {
    id: `c${i + 1}`,
    clientName: name,
    lastMessage: msg,
    timestamp: ts.toISOString(),
    status,
  }
})

export const orders: Order[] = Array.from({ length: 12 }).map((_, i) => {
  const name = names[(i * 2) % names.length]
  const product = sample(productTypes)
  const status: OrderStatus = sample(['em_andamento', 'finalizado', 'cancelado', 'nao_confirmado'])
  return {
    id: `o${i + 1}`,
    clientName: name,
    productType: product,
    eventDate: randomFutureDate(0, 7),
    peopleCount: [10, 15, 20, 25, 30, 40, 50][Math.floor(Math.random() * 7)],
    status,
  }
})

export function getConversations() { return conversations }
export function getOrders() { return orders }

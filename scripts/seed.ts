import { getSql } from '../lib/db/client'

const sql = getSql()

// ─── Dados base dos mocks ───────────────────────────────────────────────────

const names = [
  'Maria Souza', 'João Santos', 'Ana Paula', 'Pedro Henrique',
  'Carla Mendes', 'Lucas Lima', 'Fernanda Alves', 'Rafael Gomes',
  'Juliana Rocha', 'Bruno Costa', 'Mariana Ribeiro', 'Felipe Araujo',
]

const phones = [
  '+55 11 91234-5678', '+55 21 98765-4321', '+55 31 97654-3210', '+55 41 96543-2109',
  '+55 51 95432-1098', '+55 61 94321-0987', '+55 71 93210-9876', '+55 81 92109-8765',
  '+55 11 91098-7654', '+55 21 90987-6543', '+55 31 99876-5432', '+55 41 98765-4321',
]

const productTypes = ['Bolo', 'Doces', 'Salgados', 'Refeição'] as const
const productSubtypes: Record<string, string[]> = {
  'Bolo':      ['Chocolate', 'Red Velvet', 'Morango', 'Limão', 'Baunilha'],
  'Doces':     ['Brigadeiro', 'Beijinho', 'Bicho-de-pé', 'Cajuzinho', 'Palha Italiana'],
  'Salgados':  ['Coxinha', 'Enroladinho', 'Mini-quiche', 'Kibe', 'Bolinha de Queijo'],
  'Refeição':  ['Feijoada', 'Torta', 'Lasanha', 'Prato executivo', 'Arroz carreteiro'],
}
const baseMessages = [
  'Quanto custa um bolo para 20 pessoas?', 'Vocês fazem brigadeiro gourmet?',
  'Qual o prazo para encomenda de salgados?', 'Tem disponibilidade para sábado?',
  'Quais sabores de bolo vocês têm?', 'Aceitam Pix?',
  'Entrega no bairro Centro?', 'Preciso de uma refeição para 30 pessoas.',
]
const conversationStatuses = ['nova', 'em_atendimento', 'aguardando', 'finalizada'] as const
const orderStatuses = ['em_andamento', 'finalizado', 'cancelado', 'nao_confirmado'] as const
const painelStatuses = ['atendimento', 'agendado', 'preparando', 'pronto', 'entregue', 'cancelado'] as const
const paymentMethods = ['pix', 'cartao_credito', 'dinheiro'] as const
const peopleCounts = [10, 15, 20, 25, 30, 40, 50]
const priceSurplus = [12, 27, 8, 43, 19, 35, 6, 48, 22, 31, 14, 39]
const deliveryOffsets = [30, 60, 90, 3*60, 6*60, 12*60, 18*60, 36*60, 48*60, 72*60, 5*24*60, 7*24*60]
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
const threadTemplates: [string, string][][] = [
  [['client','Oi, queria encomendar um bolo de chocolate para 30 pessoas.'],['attendant','Olá! Claro, temos várias opções. Qual a data do evento?'],['client','É no próximo sábado, dia 22.'],['attendant','Ótimo! Vou verificar nossa agenda e já te confirmo.'],['client','Perfeito, aguardo. Aceitam Pix?']],
  [['client','Bom dia! Vocês fazem brigadeiro gourmet?'],['attendant','Bom dia! Fazemos sim, com vários recheios.'],['client','Queria umas 80 unidades para uma festa.'],['attendant','Sem problema. Qual a data e horário da entrega?'],['client','Sábado às 16h, pode ser?']],
  [['client','Olá, qual o prazo mínimo para encomendar salgados?'],['attendant','Trabalhamos com 3 dias úteis de antecedência.'],['client','Ok, então quero pedir para quinta-feira.'],['attendant','Perfeito! Quantas unidades você precisa?'],['client','Umas 150 unidades, meio a meio assados e fritos.']],
  [['client','Tem disponibilidade para sábado que vem?'],['attendant','Deixa eu verificar... temos sim! O que você precisa?'],['client','Uma refeição completa para 25 pessoas.'],['attendant','Posso te sugerir opções como feijoada, torta ou lasanha. Quer um orçamento?'],['client','Sim por favor, me manda o valor.']],
  [['client','Quais sabores de bolo vocês têm?'],['attendant','Temos chocolate, red velvet, limão, morango e baunilha.'],['client','Adorei! Quero o de morango com cobertura de chantilly.'],['attendant','Ótima escolha! Para quantas pessoas seria?'],['client','Para 20 pessoas, aniversário da minha filha.']],
]

const pick = <T,>(arr: readonly T[], seed: number): T => arr[seed % arr.length]
const BASE_DATE = new Date('2026-03-22T12:00:00Z').getTime()
const tsOffsets = [10, 30, 60, 90, 120, 180, 240, 300, 360, 420, 480, 540]
const unreadCounts = [1, 2, 3, 4, 5, 1, 2, 3, 1, 2, 4, 5]
const msgOffsets = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105, 115]

// ─── Seed ───────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Iniciando seed da Doceria Demo...\n')

  // 1. Profissional demo
  const [professional] = await sql<{ id: string }[]>`
    INSERT INTO professionals
      (display_name, business_name, slug, tone_of_voice, style_prompt, service_rules, status)
    VALUES
      ('Juliana Demo', 'Doceria da Ju', 'doceria-da-ju', 'acolhedor',
       'Atendo com carinho e atenção, como se cada cliente fosse especial. Uso linguagem simples e próxima.',
       'Prazo mínimo de 3 dias úteis. Entrega de 10h às 20h. Sinal de 50% para confirmar.',
       'active')
    RETURNING id
  `
  if (!professional) {
    console.error('❌ Erro ao criar profissional')
    return
  }
  const pid = professional.id
  console.log('✅ Profissional criado:', pid)

  // 2. Config do negócio
  try {
    await sql`
      INSERT INTO business_config
        (professional_id, name, phone, email, instagram, delivery_radius_km,
         delivery_fee_per_km, min_order_value, default_deposit_percent,
         min_advance_hours, welcome_message)
      VALUES
        (${pid}, 'Doceria da Ju', '+55 11 91234-0000', 'ju@doceria.com.br',
         '@doceria_da_ju', ${15}, ${2.5}, ${80}, ${50}, ${72},
         'Olá! Bem-vindo à Doceria da Ju 🎂 Em que posso te ajudar?')
    `
    console.log('✅ Business config criado')
  } catch (e: unknown) {
    console.warn('⚠️  Config do negócio:', e instanceof Error ? e.message : e)
  }

  // 3. Clientes (12 únicos por telefone)
  const clientsData = phones.map((phone, i) => ({
    professional_id: pid,
    name: names[i % names.length],
    phone,
    source: 'whatsapp',
    total_orders: 1,
    total_spent: 0,
    created_at: new Date(BASE_DATE - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
  }))

  const clients = await sql<{ id: string; phone: string }[]>`
    INSERT INTO clients ${sql(clientsData)}
    RETURNING id, phone
  `
  const clientByPhone = new Map(clients.map((c: { id: string; phone: string }) => [c.phone, c.id]))
  console.log('✅ Clientes criados:', clients.length)

  // 4. Conversas
  const conversationsData = Array.from({ length: 12 }, (_, i) => {
    const ts = new Date('2026-03-22T10:00:00Z')
    ts.setMinutes(ts.getMinutes() - tsOffsets[i % tsOffsets.length])
    const status = pick(conversationStatuses, i)
    return {
      professional_id: pid,
      client_id: clientByPhone.get(phones[i])!,
      status,
      channel: 'whatsapp',
      unread_count: status === 'nova' ? unreadCounts[i % unreadCounts.length] : 0,
      last_message: pick(baseMessages, i * 3),
      last_message_at: ts.toISOString(),
    }
  })

  const convRows = await sql<{ id: string }[]>`
    INSERT INTO conversations ${sql(conversationsData)}
    RETURNING id
  `
  console.log('✅ Conversas criadas:', convRows.length)

  // 5. Pedidos, pagamentos e mensagens
  let ordersOk = 0
  for (let i = 0; i < 12; i++) {
    const product = pick(productTypes, i * 3)
    const status = pick(orderStatuses, i)
    const painelStatus = painelStatuses[i % painelStatuses.length]
    const deliveryDt = new Date(BASE_DATE + deliveryOffsets[i % deliveryOffsets.length] * 60 * 1000)
    const people = peopleCounts[i % peopleCounts.length]
    const totalPrice = parseFloat((80 + people * 4.5 + priceSurplus[i % priceSurplus.length]).toFixed(2))
    const paidAmount = status === 'finalizado' ? totalPrice : parseFloat((totalPrice * 0.5).toFixed(2))
    const msgAt = new Date(BASE_DATE - msgOffsets[i % msgOffsets.length] * 60 * 1000)
    const createdAt = new Date(BASE_DATE - (i + 1) * 24 * 60 * 60 * 1000).toISOString()
    const clientId = clientByPhone.get(phones[i])!
    const conversationId = convRows[i].id

    try {
      const [orderRow] = await sql<{ id: string }[]>`
        INSERT INTO orders
          (professional_id, client_id, conversation_id, product_type, product_subtype,
           event_date, delivery_datetime, delivery_type, people_count, observations,
           internal_notes, total_price, status, painel_status,
           last_message, last_message_at, created_at, updated_at)
        VALUES
          (${pid}, ${clientId}, ${conversationId}, ${product},
           ${pick(productSubtypes[product], i * 7)},
           ${deliveryDt.toISOString().split('T')[0]}, ${deliveryDt.toISOString()},
           ${i % 3 === 0 ? 'retirada' : 'entrega'}, ${people},
           ${pick(observationsSamples, i)},
           ${i % 4 === 0 ? 'Verificar disponibilidade de ingredientes.' : ''},
           ${totalPrice}, ${status}, ${painelStatus},
           ${pick(baseMessages, i * 2)}, ${msgAt.toISOString()},
           ${createdAt}, ${msgAt.toISOString()})
        RETURNING id
      `

      // Pagamento
      await sql`
        INSERT INTO payments
          (professional_id, order_id, method, status, total_amount, paid_amount,
           due_amount, deposit_percent, deposit_paid_at, full_paid_at)
        VALUES
          (${pid}, ${orderRow.id}, ${pick(paymentMethods, i * 5)},
           ${status === 'finalizado' ? 'pago' : status === 'cancelado' ? 'estornado' : 'parcial'},
           ${totalPrice}, ${paidAmount},
           ${parseFloat((totalPrice - paidAmount).toFixed(2))},
           ${50}, ${createdAt},
           ${status === 'finalizado' ? deliveryDt.toISOString() : null})
      `

      // Mensagens
      const thread = threadTemplates[i % threadTemplates.length]
      const now = Date.now()
      const messagesData = thread.map(([sender, text], j) => ({
        professional_id: pid,
        conversation_id: conversationId,
        order_id: orderRow.id,
        sender,
        direction: sender === 'client' ? 'inbound' : 'outbound',
        text,
        status: 'received',
        sent_at: new Date(now - (thread.length - j) * 8 * 60 * 1000).toISOString(),
      }))
      await sql`INSERT INTO messages ${sql(messagesData)}`

      ordersOk++
    } catch (e: unknown) {
      console.warn(`⚠️  Pedido ${i + 1}:`, e instanceof Error ? e.message : e)
    }
  }

  console.log(`✅ Pedidos criados: ${ordersOk}/12`)
  console.log('\n🎉 Seed completo! Projeto pronto para desenvolvimento.')
  await sql.end()
}

seed().catch(err => {
  console.error('❌ Seed falhou:', err)
  process.exit(1)
})

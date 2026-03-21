import { SimpleBarChart } from '@/components/charts/SimpleBarChart'
import { getConversations, getOrders } from '@/lib/mockData'

function countTodayMessages() {
  const today = new Date()
  return getConversations().filter(c => {
    const d = new Date(c.timestamp)
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
  }).length
}

function countByDayLast7Days() {
  const now = new Date()
  const labels: string[] = []
  const values: number[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short' })
    labels.push(label)
    const val = getConversations().filter(c => {
      const cd = new Date(c.timestamp)
      return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth() && cd.getDate() === d.getDate()
    }).length
    values.push(val)
  }
  return { labels, values }
}

function countOrdersInProgress() {
  return getOrders().filter(o => o.status === 'em_andamento' || o.status === 'nao_confirmado').length
}

function countOrdersFinished() {
  return getOrders().filter(o => o.status === 'finalizado').length
}

function countNewClients() {
  // aproximado: clientes com conversa nos últimos 7 dias
  const seen = new Set<string>()
  const now = new Date()
  getConversations().forEach(c => {
    const d = new Date(c.timestamp)
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    if (diff <= 7) seen.add(c.clientName)
  })
  return seen.size
}

export default function DashboardPage() {
  const messagesToday = countTodayMessages()
  const { labels, values } = countByDayLast7Days()
  const inProgress = countOrdersInProgress()
  const finished = countOrdersFinished()
  const newClients = countNewClients()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-500">Mensagens hoje</div>
          <div className="text-2xl font-semibold">{messagesToday}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">Pedidos em andamento</div>
          <div className="text-2xl font-semibold">{inProgress}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">Pedidos finalizados</div>
          <div className="text-2xl font-semibold">{finished}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">Novos clientes (7 dias)</div>
          <div className="text-2xl font-semibold">{newClients}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="mb-3 font-medium">Mensagens por dia (7d)</div>
          <SimpleBarChart labels={labels} values={values} />
        </div>
        <div className="card p-4">
          <div className="mb-3 font-medium">Pedidos por semana</div>
          {/* gráfico simples mockado */}
          <SimpleBarChart labels={["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"]} values={[3,5,4,6,5,2,1]} />
        </div>
      </div>
    </div>
  )
}

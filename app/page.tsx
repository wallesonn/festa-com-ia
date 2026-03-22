import { SimpleBarChart } from '@/components/charts/SimpleBarChart'
import { ActivityTicker } from '@/components/dashboard/ActivityTicker'
import { getConversations, getOrders } from '@/lib/mockData'
import { MessageCircle, ShoppingBag, CheckCircle, Users, TrendingUp, TrendingDown, Clock, Star, Package } from 'lucide-react'

function countTodayMessages() {
  const today = new Date()
  return getConversations().filter(c => {
    const d = new Date(c.timestamp)
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
  }).length
}


function countOrdersInProgress() {
  return getOrders().filter(o => o.status === 'em_andamento' || o.status === 'nao_confirmado').length
}

function countOrdersFinished() {
  return getOrders().filter(o => o.status === 'finalizado').length
}

function countNewClients() {
  const seen = new Set<string>()
  const now = new Date()
  getConversations().forEach(c => {
    const d = new Date(c.timestamp)
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    if (diff <= 7) seen.add(c.clientName)
  })
  return seen.size
}


const topProducts = [
  { name: 'Bolo de Chocolate', orders: 38, pct: 100, color: 'bg-pink-500' },
  { name: 'Salgados Mistos', orders: 31, pct: 82, color: 'bg-violet-500' },
  { name: 'Brigadeiro Gourmet', orders: 27, pct: 71, color: 'bg-amber-500' },
  { name: 'Bolo Red Velvet', orders: 19, pct: 50, color: 'bg-rose-500' },
  { name: 'Kit Festa Completo', orders: 14, pct: 37, color: 'bg-emerald-500' },
]

const upcomingDeliveries = [
  { client: 'Ana Lima', product: 'Bolo Red Velvet', time: 'Hoje 14h', urgent: true },
  { client: 'Beatriz Melo', product: '80 brigadeiros', time: 'Hoje 16h', urgent: true },
  { client: 'Carlos Souza', product: 'Kit Festa 25 pessoas', time: 'Hoje 18h', urgent: false },
  { client: 'Diana Rocha', product: '150 salgados', time: 'Amanhã 10h', urgent: false },
  { client: 'Eduardo Pinto', product: 'Bolo de Morango', time: 'Amanhã 14h', urgent: false },
]

const orderStatusData = [
  { label: 'Atendimento', value: 4, color: 'bg-blue-500', pct: 20 },
  { label: 'Agendado', value: 6, color: 'bg-violet-500', pct: 30 },
  { label: 'Preparando', value: 5, color: 'bg-amber-500', pct: 25 },
  { label: 'Pronto', value: 3, color: 'bg-emerald-500', pct: 15 },
  { label: 'Entregue', value: 2, color: 'bg-gray-500', pct: 10 },
]

export default function DashboardPage() {
  const messagesToday = countTodayMessages()
  const inProgress = countOrdersInProgress()
  const finished = countOrdersFinished()
  const newClients = countNewClients()

  return (
    <div className="space-y-6">

      {/* Ticker de atividade */}
      <ActivityTicker />

      {/* Métricas principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Mensagens hoje</span>
            <div className="p-1.5 rounded-lg bg-blue-500/20"><MessageCircle className="h-4 w-4 text-blue-400" /></div>
          </div>
          <div className="text-3xl font-bold">{messagesToday || 7}</div>
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp className="h-3 w-3" /> +12% vs ontem
          </div>
        </div>

        <div className="card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Em andamento</span>
            <div className="p-1.5 rounded-lg bg-amber-500/20"><ShoppingBag className="h-4 w-4 text-amber-400" /></div>
          </div>
          <div className="text-3xl font-bold">{inProgress || 8}</div>
          <div className="flex items-center gap-1 text-xs text-amber-400">
            <Clock className="h-3 w-3" /> 3 entregam hoje
          </div>
        </div>

        <div className="card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Finalizados (mês)</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20"><CheckCircle className="h-4 w-4 text-emerald-400" /></div>
          </div>
          <div className="text-3xl font-bold">{finished || 42}</div>
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp className="h-3 w-3" /> +8% vs mês anterior
          </div>
        </div>

        <div className="card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Novos clientes</span>
            <div className="p-1.5 rounded-lg bg-pink-500/20"><Users className="h-4 w-4 text-pink-400" /></div>
          </div>
          <div className="text-3xl font-bold">{newClients || 9}</div>
          <div className="flex items-center gap-1 text-xs text-rose-400">
            <TrendingDown className="h-3 w-3" /> -3% vs semana anterior
          </div>
        </div>
      </div>

      {/* Status + Top Produtos + Próximas Entregas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Status dos Pedidos */}
        <div className="card p-4">
          <div className="mb-4 font-semibold">Status dos Pedidos</div>
          <div className="space-y-3">
            {orderStatusData.map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">{s.label}</span>
                  <span className="text-gray-400">{s.value} pedidos</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-xs text-gray-400">
            <span>Total ativo</span>
            <span className="text-white font-semibold">20 pedidos</span>
          </div>
        </div>

        {/* Top Produtos */}
        <div className="card p-4">
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <Star className="h-4 w-4 text-amber-400" /> Top Produtos
          </div>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-200 truncate">{p.name}</span>
                    <span className="text-gray-400 shrink-0 ml-2">{p.orders}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Próximas Entregas */}
        <div className="card p-4">
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <Package className="h-4 w-4 text-violet-400" /> Próximas Entregas
          </div>
          <div className="space-y-2">
            {upcomingDeliveries.map((d, i) => (
              <div key={i} className={`flex items-start gap-3 p-2.5 rounded-lg ${d.urgent ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-white/5'}`}>
                <div className={`mt-0.5 shrink-0 h-2 w-2 rounded-full ${d.urgent ? 'bg-rose-400' : 'bg-gray-500'}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-100 truncate">{d.client}</div>
                  <div className="text-[11px] text-gray-400 truncate">{d.product}</div>
                </div>
                <div className={`text-[11px] shrink-0 font-medium ${d.urgent ? 'text-rose-400' : 'text-gray-400'}`}>{d.time}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="mb-4 font-semibold">Pedidos por dia (semana atual)</div>
          <SimpleBarChart labels={['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']} values={[4, 6, 5, 8, 7, 3, 2]} />
        </div>

        <div className="card p-4">
          <div className="mb-4 font-semibold">Receita estimada (últimos 6 meses)</div>
          <SimpleBarChart labels={['Out','Nov','Dez','Jan','Fev','Mar']} values={[3200, 4100, 6800, 3900, 4500, 5200]} />
          <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-gray-400">Este mês</div>
              <div className="text-sm font-bold text-emerald-400">R$ 5.200</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Mês anterior</div>
              <div className="text-sm font-bold text-gray-300">R$ 4.500</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Crescimento</div>
              <div className="text-sm font-bold text-emerald-400">+15,6%</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

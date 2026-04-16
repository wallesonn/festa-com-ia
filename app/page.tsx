import { SimpleBarChart } from '@/components/charts/SimpleBarChart'
import { ActivityTicker } from '@/components/dashboard/ActivityTicker'
import { RecentConversations, type RecentConversationItem } from '@/components/dashboard/RecentConversations'
import {
  getDashboardStats,
  getFirstProfessional,
  getOrdersWithPayments,
  getRecentActivity,
  getRecentConversations,
  type ActivityItem,
  type DashboardStats,
  type RecentConversationRow,
} from '@/lib/db/queries'
import { dbRowToOrder } from '@/lib/db/mappers'
import type { Order } from '@/lib/types'
import { urgencyLevel } from '@/lib/utils'
import {
  MessageCircle, ShoppingBag, CheckCircle, Users,
  TrendingUp, TrendingDown, Clock, Star, Package,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const PAINEL_COLORS: Record<string, string> = {
  atendimento: 'bg-blue-500',
  agendado: 'bg-violet-500',
  preparando: 'bg-amber-500',
  pronto: 'bg-emerald-500',
  entregue: 'bg-gray-500',
}

const PRODUCT_COLORS: string[] = ['bg-pink-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-emerald-500']

const MONTH_LABEL_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function pctDelta(current: number, previous: number): number | null {
  if (!previous) return null
  return Math.round(((current - previous) / previous) * 100)
}

function formatCurrencyShort(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0)
}

function monthLabel(ym: string): string {
  const [, m] = ym.split('-')
  const idx = Math.max(0, Math.min(11, parseInt(m, 10) - 1))
  return MONTH_LABEL_PT[idx] ?? ym
}

async function loadDashboard(): Promise<{
  stats: DashboardStats | null
  orders: Order[]
  conversations: RecentConversationRow[]
  activity: ActivityItem[]
}> {
  try {
    const professional = await getFirstProfessional()
    if (!professional) return { stats: null, orders: [], conversations: [], activity: [] }
    const [stats, rows, conversations, activity] = await Promise.all([
      getDashboardStats(professional.id),
      getOrdersWithPayments(professional.id),
      getRecentConversations(professional.id, 30),
      getRecentActivity(professional.id, 2, 30),
    ])
    return { stats, orders: rows.map(dbRowToOrder), conversations, activity }
  } catch {
    return { stats: null, orders: [], conversations: [], activity: [] }
  }
}

export default async function DashboardPage() {
  const { stats, orders, conversations, activity } = await loadDashboard()

  // KPIs
  const messagesToday = stats?.messages_today ?? 0
  const messagesDelta = stats ? pctDelta(stats.messages_today, stats.messages_yesterday) : null
  const inProgress = stats?.orders_in_progress ?? 0
  const deliveringToday = stats?.orders_delivering_today ?? 0
  const finishedMonth = stats?.orders_finished_month ?? 0
  const finishedDelta = stats ? pctDelta(stats.orders_finished_month, stats.orders_finished_prev_month) : null
  const newClients = stats?.new_clients_week ?? 0
  const newClientsDelta = stats ? pctDelta(stats.new_clients_week, stats.new_clients_prev_week) : null

  // Status dos pedidos
  const painelCountsRaw = stats
    ? [
        { key: 'atendimento', value: stats.painel_atendimento },
        { key: 'agendado', value: stats.painel_agendado },
        { key: 'preparando', value: stats.painel_preparando },
        { key: 'pronto', value: stats.painel_pronto },
        { key: 'entregue', value: stats.painel_entregue },
      ]
    : []
  const painelMax = Math.max(...painelCountsRaw.map(c => c.value), 1)
  const orderStatusData = painelCountsRaw.map(c => ({
    label: c.key.charAt(0).toUpperCase() + c.key.slice(1),
    value: c.value,
    color: PAINEL_COLORS[c.key],
    pct: Math.round((c.value / painelMax) * 100),
  }))
  const totalActive = stats?.total_active ?? 0

  // Top produtos
  const topRaw = stats?.top_products ?? []
  const topMax = topRaw[0]?.orders ?? 1
  const topProducts = topRaw.map((p, i) => ({
    name: p.name,
    orders: p.orders,
    pct: Math.round((p.orders / topMax) * 100),
    color: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
  }))

  // Próximas entregas (reaproveita orders mapeados)
  const now = new Date()
  const upcoming = orders
    .filter(o => o.status !== 'cancelado' && o.painelStatus !== 'entregue' && o.painelStatus !== 'cancelado')
    .filter(o => new Date(o.deliveryDatetime) > now)
    .sort((a, b) => new Date(a.deliveryDatetime).getTime() - new Date(b.deliveryDatetime).getTime())
    .slice(0, 5)
    .map(o => {
      const dt = new Date(o.deliveryDatetime)
      const sameDay = dt.toDateString() === now.toDateString()
      const label = sameDay
        ? `Hoje ${dt.getHours()}h`
        : `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')} ${dt.getHours()}h`
      return {
        client: o.clientName,
        product: `${o.productType} · ${o.peopleCount}p`,
        time: label,
        urgency: urgencyLevel(o.deliveryDatetime),
      }
    })

  // Gráficos
  const weekValues = stats?.weekday_counts ?? [0, 0, 0, 0, 0, 0, 0]
  const monthly = stats?.monthly_revenue ?? []
  const monthsLabels = monthly.map(m => monthLabel(m.month))
  const monthsValues = monthly.map(m => Number(m.total) || 0)
  const revenueMonth = Number(stats?.revenue_month ?? 0)
  const revenuePrev = Number(stats?.revenue_prev_month ?? 0)
  const revenueDelta = pctDelta(revenueMonth, revenuePrev)

  // Conversas
  const convItems: RecentConversationItem[] = conversations.map(c => ({
    id: c.id,
    clientName: c.client_name,
    clientPhone: c.client_phone,
    lastMessage: c.last_message ?? '',
    lastMessageAt: c.last_message_at,
    responded:
      c.last_direction === 'outbound' ||
      c.last_sender === 'attendant' ||
      (c.last_direction === null && c.unread_count === 0),
    unreadCount: c.unread_count ?? 0,
  }))

  return (
    <div className="w-full space-y-6">

      {/* Header */}
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-fuchsia-500/20 via-white/5 to-violet-500/15 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_42%)]" />
          <div className="relative space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.28em] text-gray-200">
              Visão geral
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Dashboard</h1>
          </div>
        </div>
      </div>

      <ActivityTicker initialItems={activity} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Mensagens hoje"
          value={messagesToday}
          icon={<MessageCircle className="h-4 w-4 text-blue-400" />}
          iconBg="border-blue-500/20 bg-blue-500/15"
          delta={messagesDelta}
          deltaSuffix="vs ontem"
        />
        <KpiCard
          label="Em andamento"
          value={inProgress}
          icon={<ShoppingBag className="h-4 w-4 text-amber-400" />}
          iconBg="border-amber-500/20 bg-amber-500/15"
          hint={deliveringToday > 0 ? `${deliveringToday} entregam hoje` : 'Sem entregas hoje'}
          hintIcon={<Clock className="h-3 w-3" />}
          hintColor="text-amber-400"
        />
        <KpiCard
          label="Finalizados (mês)"
          value={finishedMonth}
          icon={<CheckCircle className="h-4 w-4 text-emerald-400" />}
          iconBg="border-emerald-500/20 bg-emerald-500/15"
          delta={finishedDelta}
          deltaSuffix="vs mês anterior"
        />
        <KpiCard
          label="Novos clientes (7d)"
          value={newClients}
          icon={<Users className="h-4 w-4 text-pink-400" />}
          iconBg="border-pink-500/20 bg-pink-500/15"
          delta={newClientsDelta}
          deltaSuffix="vs semana anterior"
        />
      </div>

      {/* Status + Top Produtos + Próximas Entregas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <div className="mb-4 font-semibold text-white">Status dos Pedidos</div>
          <div className="space-y-3">
            {orderStatusData.length === 0 && <div className="text-xs text-gray-500">Sem pedidos.</div>}
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
            <span className="text-white font-semibold">{totalActive} pedidos</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <div className="mb-4 flex items-center gap-2 font-semibold text-white">
            <Star className="h-4 w-4 text-amber-400" /> Top Produtos
          </div>
          <div className="space-y-3">
            {topProducts.length === 0 && <div className="text-xs text-gray-500">Sem dados.</div>}
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-200 truncate capitalize">{p.name}</span>
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

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <div className="mb-4 flex items-center gap-2 font-semibold text-white">
            <Package className="h-4 w-4 text-violet-400" /> Próximas Entregas
          </div>
          <div className="space-y-2">
            {upcoming.length === 0 && <div className="text-xs text-gray-500">Nenhuma entrega futura.</div>}
            {upcoming.map((d, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-2.5 rounded-xl ${
                  d.urgency === 'vermelho'
                    ? 'bg-rose-500/10 border border-rose-500/20 animate-urgency-red'
                    : d.urgency === 'laranja'
                      ? 'bg-amber-400/10 border border-amber-400/20 animate-urgency-amber'
                      : 'bg-white/5 border border-white/5'
                }`}
              >
                <div className={`mt-0.5 shrink-0 h-2 w-2 rounded-full ${d.urgency === 'vermelho' ? 'bg-rose-400 animate-urgency-red' : d.urgency === 'laranja' ? 'bg-amber-400 animate-urgency-amber' : 'bg-gray-500'}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-100 truncate">{d.client}</div>
                  <div className="text-[11px] text-gray-400 truncate">{d.product}</div>
                </div>
                <div className={`text-[11px] shrink-0 font-medium ${d.urgency === 'vermelho' ? 'text-rose-400 animate-urgency-red' : d.urgency === 'laranja' ? 'text-amber-400 animate-urgency-amber' : 'text-gray-400'}`}>{d.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conversas recentes + Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <RecentConversations items={convItems} />
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
            <div className="mb-4 font-semibold text-white">Pedidos por dia (semana atual)</div>
            <SimpleBarChart labels={['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']} values={weekValues} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
            <div className="mb-4 font-semibold text-white">Receita entregue por mês (últimos 6 meses)</div>
            <SimpleBarChart labels={monthsLabels.length ? monthsLabels : ['—']} values={monthsValues.length ? monthsValues : [0]} />
            <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs text-gray-400">Este mês</div>
                <div className="text-sm font-bold text-emerald-400">{formatCurrencyShort(revenueMonth)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Mês anterior</div>
                <div className="text-sm font-bold text-gray-300">{formatCurrencyShort(revenuePrev)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Crescimento</div>
                <div className={`text-sm font-bold ${revenueDelta !== null && revenueDelta < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {revenueDelta === null ? '—' : `${revenueDelta > 0 ? '+' : ''}${revenueDelta}%`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

function KpiCard({
  label, value, icon, iconBg, delta, deltaSuffix, hint, hintIcon, hintColor,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  iconBg: string
  delta?: number | null
  deltaSuffix?: string
  hint?: string
  hintIcon?: React.ReactNode
  hintColor?: string
}) {
  const hasDelta = typeof delta === 'number'
  const up = hasDelta && (delta as number) >= 0
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
        <div className={`p-1.5 rounded-xl border ${iconBg}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {hasDelta ? (
        <div className={`flex items-center gap-1 text-xs ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {up ? '+' : ''}{delta}% {deltaSuffix}
        </div>
      ) : hint ? (
        <div className={`flex items-center gap-1 text-xs ${hintColor ?? 'text-gray-400'}`}>
          {hintIcon}
          {hint}
        </div>
      ) : (
        <div className="text-xs text-gray-500">—</div>
      )}
    </div>
  )
}

import { KanbanColumn } from '@/components/kanban/KanbanColumn'
import { PainelCard } from '@/components/painel/PainelCard'
import { getOrders } from '@/lib/mockData'
import { painelStatusLabel } from '@/lib/utils'
import { PainelStatus } from '@/lib/types'

const columns: { key: PainelStatus; title: string }[] = [
  { key: 'atendimento', title: 'Atendimento' },
  { key: 'agendado',    title: 'Agendado' },
  { key: 'preparando',  title: 'Preparando' },
  { key: 'pronto',      title: 'Pronto' },
  { key: 'entregue',    title: 'Entregue' },
  { key: 'cancelado',   title: 'Cancelado' },
]

export default function PainelPage() {
  const orders = getOrders()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-100">Painel</h1>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" /> Urgente (&lt; 2h)</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" /> Próximo (2–24h)</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-lime-400" /> Agendado (&gt; 24h)</span>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const items = orders.filter(o => o.painelStatus === col.key)
          return (
            <KanbanColumn key={col.key} title={col.title} count={items.length}>
              {items.map(o => (
                <PainelCard key={o.id} order={o} />
              ))}
            </KanbanColumn>
          )
        })}
      </div>
    </div>
  )
}

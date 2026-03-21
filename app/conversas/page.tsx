import { KanbanColumn } from '@/components/kanban/KanbanColumn'
import { ConversationCard } from '@/components/conversations/ConversationCard'
import { getConversations } from '@/lib/mockData'
import { ConversationStatus } from '@/lib/types'

const columns: { key: ConversationStatus; title: string }[] = [
  { key: 'nova', title: 'Novas' },
  { key: 'em_atendimento', title: 'Em atendimento' },
  { key: 'aguardando', title: 'Aguardando cliente' },
  { key: 'finalizada', title: 'Finalizadas' },
]

export default function ConversasPage() {
  const data = getConversations()

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">Todas as conversas visíveis em uma única tela (sem chat individual).</div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const items = data.filter(c => c.status === col.key)
          return (
            <KanbanColumn key={col.key} title={col.title} count={items.length}>
              {items.map(c => (
                <ConversationCard key={c.id} clientName={c.clientName} lastMessage={c.lastMessage} timestamp={c.timestamp} />
              ))}
            </KanbanColumn>
          )
        })}
      </div>
    </div>
  )
}

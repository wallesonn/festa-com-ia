import { getFirstProfessional, getClientSummariesByProfessional } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatDate(value: string | null) {
  if (!value) return 'Sem pedidos'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export default async function ClientesPage() {
  try {
    const professional = await getFirstProfessional()

    if (!professional) {
      return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-gray-300">
          Nenhum profissional encontrado para carregar os clientes.
        </div>
      )
    }

    const clients = await getClientSummariesByProfessional(professional.id)
    const totalClients = clients.length
    const totalOrders = clients.reduce((sum, client) => sum + client.total_orders, 0)
    const totalRevenue = clients.reduce((sum, client) => sum + Number(client.total_spent || 0), 0)

    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_100px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-gray-400">Clientes</p>
              <h1 className="mt-1 text-3xl font-semibold text-white">Clientes do profissional</h1>
              <p className="mt-2 text-sm text-gray-300">Visão geral da base de clientes vinculada ao negócio.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm text-gray-300">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Clientes</div>
                <div className="mt-1 text-lg font-semibold text-white">{totalClients}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Pedidos</div>
                <div className="mt-1 text-lg font-semibold text-white">{totalOrders}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Faturamento</div>
                <div className="mt-1 text-lg font-semibold text-white">{currency.format(totalRevenue)}</div>
              </div>
            </div>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-gray-300">
            Nenhum cliente encontrado no banco para este profissional.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {clients.map((client) => (
              <article key={client.id} className="rounded-[1.75rem] border border-white/10 bg-[#121212] p-5 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{client.name}</h2>
                    <p className="mt-1 text-sm text-gray-400">{client.phone}</p>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                    {client.conversations_count} conversa{client.conversations_count === 1 ? '' : 's'}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Pedidos</div>
                    <div className="mt-1 font-semibold text-white">{client.total_orders}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Gasto total</div>
                    <div className="mt-1 font-semibold text-white">{currency.format(Number(client.total_spent || 0))}</div>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-sm text-gray-300">
                  <div>
                    <span className="text-gray-500">Último pedido: </span>
                    <span>{formatDate(client.last_order_at)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cadastro: </span>
                    <span>{formatDate(client.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Origem: </span>
                    <span>{client.source ?? 'Não informada'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Observações: </span>
                    <span>{client.notes?.trim() ? client.notes : 'Sem observações'}</span>
                  </div>
                </div>

                {client.tags?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {client.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    )
  } catch (err) {
    console.error('[clientes] failed to load clients:', err)

    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-100">
        Erro ao carregar os clientes reais. Verifique a conexão com o banco e tente novamente.
      </div>
    )
  }
}

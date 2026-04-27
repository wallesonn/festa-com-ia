"use client"

import { useEffect, useState } from 'react'
import { createOrder, deleteOrder, markPayment, updateOrder } from '@/app/pedidos/actions'
import { Order, PRODUCT_GROUPS, PRODUCT_SUBTYPES, ProductType, PainelStatus, DeliveryType, PaymentMethod } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'
import { useOrdersRealtimeRefresh } from '@/lib/realtime/use-orders-realtime-refresh'
import { useProfessional } from '@/lib/context/ProfessionalContext'
import { fmtDatetime } from '@/lib/utils'
import { ChevronDown, Plus, X, Search, Package, Users, Calendar, CheckCircle, XCircle, AlertCircle, Trash2, Wallet, RotateCcw, Pencil, Save, Download } from 'lucide-react'

const RECIPE_MAP: Record<string, { emoji: string; ingredients: string[]; steps: string[]; obs: string }> = {
  Bolo: {
    emoji: '🎂',
    ingredients: [
      '4 ovos grandes (caipira)', '2 xícaras de farinha de trigo peneirada',
      '1½ xícara de açúcar refinado', '200g de manteiga sem sal',
      '1 xícara de leite integral', '1 colher (sopa) de fermento em pó',
      '200g de chocolate 70% cacau (cobertura)', '1 cx de creme de leite',
    ],
    steps: [
      'Bater manteiga e açúcar até obter creme homogêneo',
      'Adicionar ovos um a um, batendo entre cada adição',
      'Alternar farinha e leite, finalizando com farinha',
      'Adicionar fermento e misturar delicadamente',
      'Assar a 180°C por 35–40 min (palito seco)',
      'Preparar ganache: derreter chocolate com creme de leite',
      'Cobrir o bolo após esfriar completamente',
    ],
    obs: 'Rendimento: 12–16 fatias. Conservar refrigerado por até 3 dias.',
  },
  Doces: {
    emoji: '🧁',
    ingredients: [
      '1 lata de leite condensado (395g)', '3 colheres (sopa) de cacau em pó',
      '1 colher (sopa) de manteiga sem sal', '200g de chocolate granulado',
      '50g de coco ralado fino', '100g de amendoim torrado triturado',
    ],
    steps: [
      'Misturar leite condensado, cacau e manteiga em panela',
      'Cozinhar em fogo médio mexendo sempre até desgrudar do fundo',
      'Esfriar completamente antes de enrolar',
      'Modelar bolinhas de ~15g cada',
      'Passar no granulado, coco ou amendoim conforme sabor',
    ],
    obs: 'Rendimento: ~50 unidades. Conservar em local fresco.',
  },
  Salgados: {
    emoji: '🥐',
    ingredients: [
      '500g de farinha de trigo', '1 tablete de fermento biológico (15g)',
      '3 colheres (sopa) de óleo', '1 colher (chá) de sal', '1 colher (sopa) de açúcar',
      '200ml de água morna', '300g de presunto fatiado', '300g de queijo mussarela',
      '2 tomates em cubos', '1 xícara de azeitonas picadas',
    ],
    steps: [
      'Dissolver fermento em água morna com açúcar, aguardar 10 min',
      'Misturar farinha, sal e óleo, adicionar fermento',
      'Sovar a massa por 10 min até ficar lisa e elástica',
      'Deixar descansar 30 min coberta com pano úmido',
      'Abrir a massa, rechear com presunto e queijo',
      'Modelar no formato desejado (coxinha, enroladinho etc.)',
      'Assar a 200°C por 20 min ou fritar em óleo quente',
    ],
    obs: 'Rendimento conforme pedido. Servir morno.',
  },
  'Refeição': {
    emoji: '🍽',
    ingredients: [
      '1 kg de feijão ou massa principal da receita',
      '500g de proteína principal (carne, frango ou mix)',
      'Temperos frescos: alho, cebola, cheiro-verde e louro',
      'Acompanhamentos: arroz, farofa, salada ou massas',
      '1 litro de caldo/base da preparação',
      'Porções individuais ou travessas conforme o pedido',
    ],
    steps: [
      'Separar os ingredientes conforme o tipo de refeição',
      'Preparar a base e cozinhar a proteína principal',
      'Ajustar tempero e ponto de cocção',
      'Montar os acompanhamentos e porções',
      'Finalizar o empratamento ou a montagem na travessa',
      'Manter aquecido até a entrega ou retirada',
    ],
    obs: 'Serve bem almoços e eventos corporativos. Ajuste a quantidade conforme o número de pessoas.',
  },
}

type ProfessionalProductTags = {
  groups: ProductType[]
  subgroups: Record<string, string[]>
  variations: Record<string, string[]>
}

function parseProductsProduced(value: string | null | undefined) {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is ProductType => PRODUCT_GROUPS.includes(item as ProductType))
    }
  } catch {
    // fallback para legado em texto livre
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is ProductType => PRODUCT_GROUPS.includes(item as ProductType))
}


const STATUS_CONFIG: Record<string, { label: string; color: string; iconName: string }> = {
  em_andamento:   { label: 'Em andamento',   color: 'text-gray-300 bg-white/5 border-white/10', iconName: 'alert' },
  finalizado:     { label: 'Finalizado',     color: 'text-gray-300 bg-white/5 border-white/10', iconName: 'check' },
  cancelado:      { label: 'Cancelado',      color: 'text-gray-300 bg-white/5 border-white/10', iconName: 'x' },
  nao_confirmado: { label: 'Não confirmado', color: 'text-gray-300 bg-white/5 border-white/10', iconName: 'package' },
}

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string }> = {
  Bolo: { label: 'Bolos', emoji: '🎂' },
  Doces: { label: 'Doces', emoji: '🧁' },
  Salgados: { label: 'Salgados', emoji: '🥐' },
  'Refeição': { label: 'Refeição', emoji: '🍽' },
}

const PAINEL_STATUS_CONFIG: Record<string, { label: string; color: string; iconName: string }> = {
  atendimento: { label: 'Atendimento', color: 'text-gray-300 bg-white/5 border-white/10', iconName: 'alert' },
  agendado:    { label: 'Agendado',    color: 'text-blue-400 bg-blue-400/10 border-blue-400/30', iconName: 'package' },
  preparando:  { label: 'Preparando',  color: 'text-violet-400 bg-violet-400/10 border-violet-400/30', iconName: 'alert' },
  pronto:      { label: 'Pronto',      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', iconName: 'check' },
  entregue:    { label: 'Entregue',    color: 'text-gray-300 bg-white/5 border-white/10', iconName: 'check' },
  cancelado:   { label: 'Cancelado',   color: 'text-gray-300 bg-white/5 border-white/10', iconName: 'x' },
}

const ORDER_FORM_TAXONOMY: Record<ProductType, { subgroups: string[]; variations: string[] }> = {
  Bolo: {
    subgroups: ['Tradicional', 'Recheado', 'Decorado', 'Naked Cake', 'Mini bolo'],
    variations: [
      'Receita tradicional',
      'Massa de chocolate',
      'Recheio trufado',
      'Cobertura de chantilly',
      'Cobertura de ganache',
      'Massa fofinha',
      'Massa branca',
      'Massa de cenoura',
      'Toque cítrico',
      'Finalização com granulado',
      'Recheio de frutas vermelhas',
      'Camadas duplas',
      'Acabamento rústico',
      'Decoração com drip',
      'Borda artesanal',
    ],
  },
  Doces: {
    subgroups: ['Brigadeiros', 'Docinhos de festa', 'Doces finos', 'Sobremesas', 'Copinhos'],
    variations: [
      'Docinho tradicional',
      'Coco ralado fino',
      'Castanha triturada',
      'Chocolate ao leite',
      'Chocolate meio amargo',
      'Creme de leite ninho',
      'Maracujá cremoso',
      'Morango fresco',
      'Doce de leite cremoso',
      'Nozes picadas',
      'Pó dourado',
      'Papel arroz',
      'Acabamento premium',
      'Recheio aerado',
      'Bocado gourmet',
    ],
  },
  Salgados: {
    subgroups: ['Fritos', 'Assados', 'Mini porções', 'Gourmet', 'Kits de salgados'],
    variations: [
      'Salgado tradicional',
      'Massa assada',
      'Massa frita',
      'Recheio de frango',
      'Recheio de carne',
      'Queijo cremoso',
      'Catupiry',
      'Temperinho caseiro',
      'Empanado leve',
      'Tamanho coquetel',
      'Porção individual',
      'Porção para cento',
      'Finalização dourada',
      'Serviço misto',
      'Sabor intenso',
    ],
  },
  Refeição: {
    subgroups: ['Feijoadas', 'Tortas', 'Lasanhas', 'Pratos executivos', 'Pratos caseiros'],
    variations: [
      'Prato tradicional',
      'Arroz temperado',
      'Feijão encorpado',
      'Molho caseiro',
      'Proteína grelhada',
      'Proteína desfiada',
      'Acompanha salada',
      'Acompanha farofa',
      'Porção individual',
      'Travessa familiar',
      'Temperos suaves',
      'Temperos marcantes',
      'Montagem executiva',
      'Pronto para aquecer',
      'Serviço completo',
    ],
  },
}

function StatusIcon({ name }: { name: string }) {
  if (name === 'alert')   return <AlertCircle className="h-3.5 w-3.5" />
  if (name === 'check')   return <CheckCircle className="h-3.5 w-3.5" />
  if (name === 'x')       return <XCircle className="h-3.5 w-3.5" />
  return <Package className="h-3.5 w-3.5" />
}

function toDatetimeLocal(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const offset = d.getTimezoneOffset() * 60000
  const local = new Date(d.getTime() - offset)
  return local.toISOString().slice(0, 16)
}

const PAINEL_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'atendimento', label: 'Atendimento' },
  { value: 'agendado',    label: 'Agendado' },
  { value: 'preparando',  label: 'Preparando' },
  { value: 'pronto',      label: 'Pronto' },
  { value: 'entregue',    label: 'Entregue' },
  { value: 'cancelado',   label: 'Cancelado' },
]

const PAYMENT_METHOD_OPTIONS = [
  { value: 'pix',              label: 'PIX' },
  { value: 'dinheiro',         label: 'Dinheiro' },
  { value: 'cartão_credito',   label: 'Cartão Crédito' },
  { value: 'cartão_debito',    label: 'Cartão Débito' },
  { value: 'transferência',    label: 'Transferência' },
]

function OrderDetailModal({
  order,
  onClose,
  onOrderDeleted,
  onOrderUpdated,
}: {
  order: Order
  onClose: () => void
  onOrderDeleted: (id: string) => void
  onOrderUpdated: (order: Order) => void
}) {
  const recipe = RECIPE_MAP[order.productType] ?? RECIPE_MAP['Bolo']
  const status = PAINEL_STATUS_CONFIG[order.painelStatus] ?? STATUS_CONFIG[order.status]
  const [tab, setTab] = useState<'info' | 'receita'>('info')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState<null | 'deposit' | 'full' | 'reset'>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editProductType, setEditProductType] = useState(order.productType)
  const [editProductSubtype, setEditProductSubtype] = useState(order.productSubtype)
  const [editPeopleCount, setEditPeopleCount] = useState(String(order.peopleCount || ''))
  const [editDeliveryDatetime, setEditDeliveryDatetime] = useState(toDatetimeLocal(order.deliveryDatetime))
  const [editDeliveryType, setEditDeliveryType] = useState(order.deliveryType)
  const [editObservations, setEditObservations] = useState(order.observations)
  const [editTotalPrice, setEditTotalPrice] = useState(String(order.totalPrice || ''))
  const [editPaymentMethod, setEditPaymentMethod] = useState(order.payment.method)
  const [editPainelStatus, setEditPainelStatus] = useState(order.painelStatus)

  function handleStartEdit() {
    setEditProductType(order.productType)
    setEditProductSubtype(order.productSubtype)
    setEditPeopleCount(String(order.peopleCount || ''))
    setEditDeliveryDatetime(toDatetimeLocal(order.deliveryDatetime))
    setEditDeliveryType(order.deliveryType)
    setEditObservations(order.observations)
    setEditTotalPrice(String(order.totalPrice || ''))
    setEditPaymentMethod(order.payment.method)
    setEditPainelStatus(order.painelStatus)
    setEditError(null)
    setIsEditing(true)
  }

  async function handleSave() {
    setEditSaving(true)
    setEditError(null)
    const isoDatetime = editDeliveryDatetime ? new Date(editDeliveryDatetime).toISOString() : ''
    const result = await updateOrder(order.id, {
      productType: editProductType,
      productSubtype: editProductSubtype,
      peopleCount: Number(editPeopleCount) || 0,
      deliveryDatetime: isoDatetime,
      deliveryType: editDeliveryType,
      observations: editObservations,
      totalPrice: Number(editTotalPrice) || 0,
      paymentMethod: editPaymentMethod,
      painelStatus: editPainelStatus,
    })
    setEditSaving(false)
    if (result.success) {
      onOrderUpdated(result.order)
      setIsEditing(false)
    } else {
      setEditError(result.error)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteOrder(order.id)
    setDeleting(false)
    if (result.success) {
      onOrderDeleted(order.id)
      onClose()
    }
  }

  async function handleMarkPayment(kind: 'deposit' | 'full' | 'reset') {
    setPaymentLoading(kind)
    setPaymentError(null)
    const result = await markPayment(order.id, kind)
    setPaymentLoading(null)
    if (result.success) {
      onOrderUpdated(result.order)
    } else {
      setPaymentError(result.error)
    }
  }

  const payment = order.payment
  const depositAmount = Math.round((payment.totalAmount * (payment.depositPercent || 0)) / 100 * 100) / 100
  const depositPaid = Boolean(payment.depositPaidAt)
  const fullPaid = Boolean(payment.fullPaidAt)
  const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  const inputCls = 'w-full rounded-lg bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 placeholder:text-gray-500 [color-scheme:dark]'
  const labelCls = 'block text-[11px] text-gray-400 uppercase tracking-wide mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{recipe.emoji}</span>
            <div>
              <div className="font-bold text-white">{order.clientName}</div>
              <div className="text-xs text-gray-400">{order.productType} · {order.peopleCount} pessoas</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && !confirmDelete && (
              <button onClick={handleStartEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors" title="Editar pedido">
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {confirmDelete ? (
              <>
                <span className="text-xs text-rose-400">Confirmar exclusão?</span>
                <button onClick={handleDelete} disabled={deleting} className="text-xs px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold transition-colors disabled:opacity-50">
                  {deleting ? 'Deletando…' : 'Sim'}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs px-2.5 py-1 rounded-lg border border-white/15 text-gray-300 hover:bg-white/5 transition-colors">
                  Não
                </button>
              </>
            ) : (
              !isEditing && (
                <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )
            )}
            <button onClick={isEditing ? () => setIsEditing(false) : onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-white/10">
          {(['info', 'receita'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {t === 'info' ? '📋 Informações' : '👩‍🍳 Receita / Produção'}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {tab === 'info' ? (
            isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tipo de produto</label>
                    <select value={editProductType} onChange={e => setEditProductType(e.target.value as ProductType)} className={inputCls}>
                      {PRODUCT_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select value={editPainelStatus} onChange={e => setEditPainelStatus(e.target.value as PainelStatus)} className={inputCls}>
                      {PAINEL_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Linha / Sabor</label>
                  <select
                    value={editProductSubtype}
                    onChange={e => setEditProductSubtype(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Selecione uma linha...</option>
                    {(professionalTags.subgroups[editProductType] || PRODUCT_SUBTYPES[editProductType] || []).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Pessoas</label>
                    <input type="number" min="0" value={editPeopleCount} onChange={e => setEditPeopleCount(e.target.value)} placeholder="0" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Tipo de entrega</label>
                    <select value={editDeliveryType} onChange={e => setEditDeliveryType(e.target.value as DeliveryType)} className={inputCls}>
                      <option value="entrega">Entrega</option>
                      <option value="retirada">Retirada</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Data e hora de entrega</label>
                  <input type="datetime-local" value={editDeliveryDatetime} onChange={e => setEditDeliveryDatetime(e.target.value)} className={inputCls} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Valor total (R$)</label>
                    <input type="number" min="0" step="0.01" value={editTotalPrice} onChange={e => setEditTotalPrice(e.target.value)} placeholder="0,00" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Forma de pagamento</label>
                    <select value={editPaymentMethod} onChange={e => setEditPaymentMethod(e.target.value as PaymentMethod)} className={inputCls}>
                      {PAYMENT_METHOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Observações</label>
                  <textarea value={editObservations} onChange={e => setEditObservations(e.target.value)} rows={3} placeholder="Detalhes do pedido…" className={`${inputCls} resize-none`} />
                </div>

                {editError && <p className="text-xs text-rose-400">{editError}</p>}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={editSaving}
                    className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {editSaving ? 'Salvando…' : 'Salvar alterações'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={editSaving}
                    className="h-10 px-4 rounded-xl border border-white/15 text-gray-300 hover:bg-white/5 text-sm transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="card p-3 flex flex-col gap-1">
                  <span className="text-[11px] text-gray-400 uppercase tracking-wide">Status</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg border w-fit ${status?.color}`}>
                    {status && <StatusIcon name={status.iconName} />}{status?.label}
                  </span>
                </div>
                <div className="card p-3 flex flex-col gap-1">
                  <span className="text-[11px] text-gray-400 uppercase tracking-wide">Pessoas</span>
                  <span className="text-white font-bold flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" />{order.peopleCount}</span>
                </div>
                <div className="card p-3 flex flex-col gap-1 col-span-2">
                  <span className="text-[11px] text-gray-400 uppercase tracking-wide">Entrega</span>
                  <span className="text-white font-semibold flex items-center gap-1.5"><Calendar className="h-4 w-4 text-violet-400" />{fmtDatetime(order.deliveryDatetime)}</span>
                </div>
              </div>

              <div className="card p-3">
                <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">Última mensagem</div>
                <p className="text-sm text-gray-200 leading-relaxed">"{order.lastMessage}"</p>
              </div>

              <div className="card p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-amber-400" />
                    <span className="text-[11px] text-gray-400 uppercase tracking-wide">Pagamento</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    fullPaid
                      ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                      : depositPaid
                        ? 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                        : 'bg-rose-500/15 border-rose-400/30 text-rose-300'
                  }`}>
                    {fullPaid ? 'Pago' : depositPaid ? 'Sinal pago' : 'Pendente'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-white/5 border border-white/10 p-2">
                    <div className="text-[10px] text-gray-400 uppercase">Total</div>
                    <div className="text-sm font-bold text-white">{fmtBRL(payment.totalAmount)}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 p-2">
                    <div className="text-[10px] text-gray-400 uppercase">Pago</div>
                    <div className="text-sm font-bold text-emerald-300">{fmtBRL(payment.paidAmount)}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 p-2">
                    <div className="text-[10px] text-gray-400 uppercase">Falta</div>
                    <div className="text-sm font-bold text-rose-300">{fmtBRL(payment.dueAmount)}</div>
                  </div>
                </div>

                {paymentError && (
                  <p className="text-xs text-rose-400">{paymentError}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleMarkPayment('deposit')}
                    disabled={paymentLoading !== null || depositPaid}
                    className="flex-1 min-w-[140px] h-9 rounded-lg text-xs font-semibold transition-colors bg-amber-500/20 border border-amber-400/30 text-amber-200 hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={`Marcar sinal de ${payment.depositPercent || 50}% (${fmtBRL(depositAmount)}) como pago`}
                  >
                    {paymentLoading === 'deposit' ? 'Salvando…' : depositPaid ? `Sinal pago · ${fmtBRL(depositAmount)}` : `Marcar sinal pago · ${fmtBRL(depositAmount)}`}
                  </button>
                  <button
                    onClick={() => handleMarkPayment('full')}
                    disabled={paymentLoading !== null || fullPaid}
                    className="flex-1 min-w-[140px] h-9 rounded-lg text-xs font-semibold transition-colors bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {paymentLoading === 'full' ? 'Salvando…' : fullPaid ? `Pago total · ${fmtBRL(payment.totalAmount)}` : `Marcar total pago · ${fmtBRL(payment.totalAmount)}`}
                  </button>
                  {(depositPaid || fullPaid) && (
                    <button
                      onClick={() => handleMarkPayment('reset')}
                      disabled={paymentLoading !== null}
                      className="h-9 px-3 rounded-lg text-xs font-semibold transition-colors border border-white/15 text-gray-300 hover:bg-white/5 disabled:opacity-40 inline-flex items-center gap-1.5"
                      title="Marcar novamente como pendente"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {paymentLoading === 'reset' ? 'Salvando…' : 'Reverter'}
                    </button>
                  )}
                </div>
              </div>

              {order.observations && (
                <div className="card p-3 space-y-2">
                  <div className="text-[11px] text-gray-400 uppercase tracking-wide">Observações</div>
                  <p className="text-sm text-gray-300">{order.observations}</p>
                </div>
              )}
            </>
            )
          ) : (
            <>
              <div className="card p-3">
                <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-3">Ingredientes</div>
                <ul className="space-y-1.5">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-200">
                      <span className="text-primary shrink-0 mt-0.5">•</span>{ing}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card p-3">
                <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-3">Modo de preparo</div>
                <ol className="space-y-2">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-200">
                      <span className="shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary text-[11px] font-bold mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="card p-3 bg-amber-500/5 border-amber-400/20">
                <div className="text-[11px] text-amber-400 uppercase tracking-wide mb-1">Observações</div>
                <p className="text-sm text-gray-300">{recipe.obs}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function RegisterModal({
  onClose,
  tags,
  onOrderCreated,
}: {
  onClose: () => void
  tags: ProfessionalProductTags
  onOrderCreated: (order: Order) => void
}) {
  const allowedGroups = tags.groups.length > 0 ? tags.groups : PRODUCT_GROUPS
  const fallbackGroup = allowedGroups[0] ?? PRODUCT_GROUPS[0]
  const [productGroup, setProductGroup] = useState<ProductType>(fallbackGroup)
  const [productSubgroup, setProductSubgroup] = useState(
    (tags.subgroups[fallbackGroup] ?? [])[0] ?? ORDER_FORM_TAXONOMY[fallbackGroup].subgroups[0],
  )
  const [productVariations, setProductVariations] = useState<string[]>([
    (tags.variations[fallbackGroup] ?? [])[0] ?? ORDER_FORM_TAXONOMY[fallbackGroup].variations[0],
  ])

  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [peopleCount, setPeopleCount] = useState('')
  const [deliveryDatetime, setDeliveryDatetime] = useState('')
  const [observations, setObservations] = useState('')
  const [totalPrice, setTotalPrice] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit() {
    if (!clientName.trim() || !clientPhone.trim()) {
      setErrorMsg('Preencha o nome e o telefone do cliente.')
      return
    }
    setSaving(true)
    setErrorMsg(null)
    const result = await createOrder({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      productType: productGroup,
      productSubtype: productVariations.length > 0
        ? `${productSubgroup} · ${productVariations.join(', ')}`
        : productSubgroup,
      observations: observations.trim(),
      peopleCount: Number(peopleCount) || 0,
      deliveryDatetime,
      totalPrice: Number(totalPrice) || 0,
      paymentMethod,
    })
    setSaving(false)
    if (result.success) {
      onOrderCreated(result.order)
      onClose()
    } else {
      setErrorMsg(result.error)
    }
  }

  function getSubgroupOptions(group: ProductType) {
    const fromProfessional = tags.subgroups[group] ?? []
    return fromProfessional.length > 0 ? fromProfessional : ORDER_FORM_TAXONOMY[group].subgroups
  }

  function getVariationOptions(group: ProductType) {
    const fromProfessional = tags.variations[group] ?? []
    return fromProfessional.length > 0 ? fromProfessional : ORDER_FORM_TAXONOMY[group].variations
  }

  useEffect(() => {
    if (!allowedGroups.includes(productGroup)) {
      const nextGroup = allowedGroups[0] ?? PRODUCT_GROUPS[0]
      const nextSubgroups = getSubgroupOptions(nextGroup)
      const nextVariations = getVariationOptions(nextGroup)
      setProductGroup(nextGroup)
      setProductSubgroup(nextSubgroups[0] ?? '')
      setProductVariations(nextVariations.length > 0 ? [nextVariations[0]] : [])
    }
  }, [allowedGroups, productGroup, tags.subgroups, tags.variations])

  function handleGroupChange(nextGroup: ProductType) {
    const nextSubgroups = getSubgroupOptions(nextGroup)
    const nextVariations = getVariationOptions(nextGroup)
    setProductGroup(nextGroup)
    setProductSubgroup((current) => (nextSubgroups.includes(current) ? current : nextSubgroups[0] ?? ''))
    setProductVariations((current) => {
      const kept = current.filter((variation) => nextVariations.includes(variation))
      return kept.length > 0 ? kept : nextVariations.length > 0 ? [nextVariations[0]] : []
    })
  }

  function toggleVariation(variation: string) {
    setProductVariations((current) =>
      current.includes(variation)
        ? current.filter((item) => item !== variation)
        : [...current, variation],
    )
  }

  const subgroupOptions = getSubgroupOptions(productGroup)
  const variationOptions = getVariationOptions(productGroup)

  useEffect(() => {
    if (!subgroupOptions.includes(productSubgroup)) {
      setProductSubgroup(subgroupOptions[0] ?? '')
    }
  }, [productSubgroup, subgroupOptions])

  useEffect(() => {
    if (variationOptions.length === 0) return

    const hasValidSelection = productVariations.some((variation) => variationOptions.includes(variation))
    if (!hasValidSelection) {
      setProductVariations([variationOptions[0]])
    }
  }, [productVariations, variationOptions])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-gray-900 border border-white/10 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <span className="font-bold text-white">Novo Pedido</span>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Nome do cliente</label>
              <input
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-gray-100 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: Ana Lima"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Telefone (WhatsApp)</label>
              <input
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                className="h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-gray-100 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: 11999998888"
              />
            </div>
          </div>

          {/* Grupo + Linha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Tipo de produto</label>
              <select
                value={productGroup}
                onChange={e => handleGroupChange(e.target.value as ProductType)}
                className="h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {allowedGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Linha</label>
              <select
                value={productSubgroup}
                onChange={e => setProductSubgroup(e.target.value)}
                className="h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {subgroupOptions.map(subgroup => (
                  <option key={subgroup} value={subgroup}>{subgroup}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Variações */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400">Variações</label>
            <details className="group rounded-lg border border-white/15 bg-black/40">
              <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-100 list-none [&::-webkit-details-marker]:hidden">
                <span>
                  {productVariations.length > 0
                    ? `${productVariations.length} variação(ões) selecionada(s)`
                    : 'Selecione uma ou mais variações'}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="max-h-48 overflow-y-auto border-t border-white/10 p-2">
                {variationOptions.map((variation) => {
                  const selected = productVariations.includes(variation)
                  return (
                    <label
                      key={variation}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                        selected ? 'bg-fuchsia-500/15 text-white' : 'text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      <span>{variation}</span>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleVariation(variation)}
                        className="h-4 w-4 rounded border-white/20 bg-black/40 text-fuchsia-500 focus:ring-fuchsia-500"
                      />
                    </label>
                  )
                })}
              </div>
            </details>
          </div>

          {/* Tags resumo */}
          {(productVariations.length > 0) && (
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Tags selecionadas</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary">{productGroup}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-200">{productSubgroup}</span>
                {productVariations.map((variation) => (
                  <span key={variation} className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2.5 py-1 text-xs text-fuchsia-100">
                    {variation}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pessoas + Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Nº de pessoas</label>
              <input
                type="number"
                value={peopleCount}
                onChange={e => setPeopleCount(e.target.value)}
                className="h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-gray-100 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Data e hora da entrega</label>
              <input
                type="datetime-local"
                value={deliveryDatetime}
                onChange={e => setDeliveryDatetime(e.target.value)}
                className="h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400">Observações</label>
            <textarea
              rows={3}
              value={observations}
              onChange={e => setObservations(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-gray-100 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Alergias, preferências, detalhes de entrega..."
            />
          </div>

          {/* Valor + Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Valor total (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalPrice}
                onChange={e => setTotalPrice(e.target.value)}
                className="h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-gray-100 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0,00"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Forma de pagamento</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_credito">Cartão de crédito</option>
                <option value="cartao_debito">Cartão de débito</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer fixo */}
        <div className="shrink-0 px-5 py-4 border-t border-white/10 space-y-3">
          {errorMsg && (
            <p className="text-xs text-rose-400 text-center">{errorMsg}</p>
          )}
          <div className="flex gap-2">
            <button onClick={onClose} disabled={saving} className="flex-1 h-11 rounded-lg border border-white/15 text-sm text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={saving} className="flex-1 h-11 rounded-lg bg-primary hover:bg-primary/80 text-white text-sm font-semibold transition-colors disabled:opacity-50">
              {saving ? 'Salvando…' : 'Cadastrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface PedidosViewProps {
  initialOrders: Order[]
}

export function PedidosView({ initialOrders }: PedidosViewProps) {
  const [orders, setOrders] = useState<Order[]>(() => initialOrders)
  const [selected, setSelected] = useState<Order | null>(null)
  const [showRegister, setShowRegister] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('todos')
  const [filterSubtype, setFilterSubtype] = useState<string>('todos')
  
  // Usamos o contexto global cacheado
  const { tags: professionalTags } = useProfessional()

  useOrdersRealtimeRefresh(Boolean(selected || showRegister))

  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  useEffect(() => {
    if (!selected) return

    const latestSelected = orders.find((order) => order.id === selected.id)
    if (!latestSelected) {
      setSelected(null)
      return
    }

    if (latestSelected.updatedAt !== selected.updatedAt || latestSelected.painelStatus !== selected.painelStatus) {
      setSelected(latestSelected)
    }
  }, [orders, selected])

  function replaceOrderInList(nextOrder: Order) {
    setOrders((current) => current.map((item) => (item.id === nextOrder.id ? nextOrder : item)))
  }

  function prependOrder(nextOrder: Order) {
    setOrders((current) => [nextOrder, ...current.filter((item) => item.id !== nextOrder.id)])
  }

  function removeOrderFromList(orderId: string) {
    setOrders((current) => current.filter((item) => item.id !== orderId))
  }

  const activeSubtypes = filterType !== 'todos' && filterType !== 'adefinir'
    ? (professionalTags.subgroups[filterType] || PRODUCT_SUBTYPES[filterType as ProductType] || [])
    : []

  function handleTypeChange(type: string) {
    setFilterType(type)
    setFilterSubtype('todos')
  }

  const filtered = orders.filter(o => {
    const matchSearch = o.clientName.toLowerCase().includes(search.toLowerCase()) || o.productType.toLowerCase().includes(search.toLowerCase()) || o.productSubtype.toLowerCase().includes(search.toLowerCase())
    
    let matchType = true
    if (filterType === 'todos') {
      matchType = true
    } else if (filterType === 'adefinir') {
      matchType = !o.productType || (o.productType as string) === '' || (o.productType as string).toLowerCase() === 'a definir'
    } else {
      matchType = o.productType === filterType
    }

    const matchSubtype = filterSubtype === 'todos' || o.productSubtype === filterSubtype
    return matchSearch && matchType && matchSubtype
  })

  const counts: Record<string, number> = {
    todos: orders.length,
    adefinir: orders.filter(o => !o.productType || (o.productType as string) === '' || (o.productType as string).toLowerCase() === 'a definir').length,
  }
  PRODUCT_GROUPS.forEach(g => {
    counts[g] = orders.filter(o => o.productType === g).length
  })

  return (
    <div className="w-full space-y-6">
      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onOrderUpdated={(nextOrder) => replaceOrderInList(nextOrder)}
          onOrderDeleted={id => {
            removeOrderFromList(id)
            setSelected(null)
          }}
        />
      )}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          tags={professionalTags}
          onOrderCreated={order => {
            prependOrder(order)
          }}
        />
      )}

      {/* Header */}
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-fuchsia-500/20 via-white/5 to-violet-500/15 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_42%)]" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.28em] text-gray-200">
                Gestão de pedidos
              </div>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">Pedidos</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">
                {orders.length} pedido{orders.length !== 1 ? 's' : ''}
              </span>
              <a
                href="/api/orders/export"
                download
                className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar arquivados
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl px-5 py-4 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => handleTypeChange('todos')}
            className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-colors border ${
              filterType === 'todos'
                ? 'bg-fuchsia-500/20 border-fuchsia-400/50 text-fuchsia-200'
                : 'border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20'
            }`}
          >
            <span>🎊</span>
            Todos
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterType === 'todos' ? 'bg-fuchsia-500/30' : 'bg-white/10'}`}>
              {counts['todos']}
            </span>
          </button>

          <button
            onClick={() => handleTypeChange('adefinir')}
            className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-colors border ${
              filterType === 'adefinir'
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                : 'border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20'
            }`}
          >
            <span>❓</span>
            A definir
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterType === 'adefinir' ? 'bg-amber-500/30' : 'bg-white/10'}`}>
              {counts['adefinir']}
            </span>
          </button>

          {professionalTags.groups.map((key) => {
            const config = CATEGORY_CONFIG[key]
            if (!config) return null
            return (
              <button
                key={key}
                onClick={() => handleTypeChange(key)}
                className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-colors border ${
                  filterType === key
                    ? 'bg-fuchsia-500/20 border-fuchsia-400/50 text-fuchsia-200'
                    : 'border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20'
                }`}
              >
                <span>{config.emoji}</span>
                {config.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterType === key ? 'bg-fuchsia-500/30' : 'bg-white/10'}`}>
                  {counts[key]}
                </span>
              </button>
            )
          })}
        </div>

        {activeSubtypes.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setFilterSubtype('todos')}
              className={`shrink-0 h-7 px-3 rounded-full text-xs font-medium transition-colors border ${
                filterSubtype === 'todos'
                  ? 'bg-white/15 border-white/30 text-white'
                  : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
              }`}
            >
              Todos os subtipos
            </button>
            {activeSubtypes.map(sub => {
              const subCount = orders.filter(o => o.productType === filterType && o.productSubtype === sub).length
              return (
                <button
                  key={sub}
                  onClick={() => setFilterSubtype(sub)}
                  className={`shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium transition-colors border ${
                    filterSubtype === sub
                      ? 'bg-white/15 border-white/30 text-white'
                      : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
                  }`}
                >
                  {sub}
                  <span className={`text-[10px] px-1 py-0.5 rounded-full ${filterSubtype === sub ? 'bg-white/20' : 'bg-white/10'}`}>{subCount}</span>
                </button>
              )
            })}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente ou produto..."
            className="w-full h-10 rounded-xl border border-white/10 bg-black/30 pl-9 pr-4 text-sm text-gray-100 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50"
          />
        </div>
      </div>

      {/* Order grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setShowRegister(true)}
          className="flex flex-col items-center justify-center gap-3 p-5 min-h-[160px] overflow-hidden rounded-2xl border-2 border-dashed border-fuchsia-400/30 bg-white/3 backdrop-blur-xl hover:border-fuchsia-400/60 hover:bg-fuchsia-500/5 transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-dashed border-fuchsia-400/40 group-hover:border-fuchsia-400/80 transition-colors">
            <Plus className="h-6 w-6 text-fuchsia-400/50 group-hover:text-fuchsia-300 transition-colors" />
          </div>
          <span className="text-sm font-medium text-fuchsia-400/60 group-hover:text-fuchsia-300 transition-colors">Novo Pedido</span>
        </button>

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-500">Nenhum pedido encontrado.</div>
        )}

        {filtered.map(o => {
          const recipe = RECIPE_MAP[o.productType] ?? RECIPE_MAP['Bolo']
          const status = PAINEL_STATUS_CONFIG[o.painelStatus] ?? STATUS_CONFIG[o.status]
          return (
            <div
              key={o.id}
              onClick={() => setSelected(o)}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex flex-col gap-3 cursor-pointer hover:bg-white/8 hover:border-white/20 transition-all min-h-[160px]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-400/20 text-xl shrink-0">
                  {recipe.emoji}
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${status?.color}`}>
                  {status && <StatusIcon name={status.iconName} />}{status?.label}
                </span>
              </div>

              <div className="flex-1">
                <div className="font-semibold text-white text-sm leading-snug line-clamp-1">{o.clientName}</div>
                <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                  {o.productType} · <span className="text-gray-300">{o.productSubtype}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-white/10 pt-2">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{o.peopleCount}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDatetime(o.deliveryDatetime)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

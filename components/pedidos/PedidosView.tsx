"use client"

import { useEffect, useState } from 'react'
import { Order, PRODUCT_GROUPS, PRODUCT_SUBTYPES, ProductType } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'
import { fmtDatetime } from '@/lib/utils'
import { ChevronDown, Plus, X, Search, Package, Users, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

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
    emoji: '🍬',
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
    emoji: '�',
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
  em_andamento:   { label: 'Em andamento',  color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',        iconName: 'alert' },
  finalizado:     { label: 'Finalizado',    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',  iconName: 'check' },
  cancelado:      { label: 'Cancelado',     color: 'text-rose-400 bg-rose-400/10 border-rose-400/30',           iconName: 'x' },
  nao_confirmado: { label: 'Não confirmado',color: 'text-gray-400 bg-gray-400/10 border-gray-400/30',           iconName: 'package' },
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

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const recipe = RECIPE_MAP[order.productType] ?? RECIPE_MAP['Bolo']
  const status = STATUS_CONFIG[order.status]
  const [tab, setTab] = useState<'info' | 'receita'>('info')

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
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
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

              {order.observations && (
                <div className="card p-3 space-y-2">
                  <div className="text-[11px] text-gray-400 uppercase tracking-wide">Observações</div>
                  <p className="text-sm text-gray-300">{order.observations}</p>
                </div>
              )}
            </>
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
}: {
  onClose: () => void
  tags: ProfessionalProductTags
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
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400">Nome do cliente</label>
            <input
              className="h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-gray-100 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Ana Lima"
            />
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
                className="h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-gray-100 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Data e hora da entrega</label>
              <input
                type="datetime-local"
                className="h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400">Observações</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-gray-100 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Alergias, preferências, detalhes de entrega..."
            />
          </div>
        </div>

        {/* Footer fixo */}
        <div className="shrink-0 flex gap-2 px-5 py-4 border-t border-white/10">
          <button onClick={onClose} className="flex-1 h-11 rounded-lg border border-white/15 text-sm text-gray-300 hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button onClick={onClose} className="flex-1 h-11 rounded-lg bg-primary hover:bg-primary/80 text-white text-sm font-semibold transition-colors">
            Cadastrar
          </button>
        </div>
      </div>
    </div>
  )
}

interface PedidosViewProps {
  initialOrders: Order[]
}

export function PedidosView({ initialOrders }: PedidosViewProps) {
  const [orders] = useState<Order[]>(initialOrders)
  const [selected, setSelected] = useState<Order | null>(null)
  const [showRegister, setShowRegister] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('todos')
  const [filterSubtype, setFilterSubtype] = useState<string>('todos')
  const [professionalTags, setProfessionalTags] = useState<ProfessionalProductTags>({
    groups: PRODUCT_GROUPS,
    subgroups: {},
    variations: {},
  })

  useEffect(() => {
    let active = true

    async function loadProfessionalTags() {
      const { data: authData } = await supabase.auth.getUser()
      if (!active || !authData.user) return

      const { data: profile } = await supabase
        .from('festa-com-ia-professionals')
        .select('products_produced,product_subgroups,product_variations')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle()

      if (!active) return

      const selectedGroups = parseProductsProduced(profile?.products_produced)
      setProfessionalTags({
        groups: selectedGroups.length > 0 ? selectedGroups : PRODUCT_GROUPS,
        subgroups: (profile?.product_subgroups as Record<string, string[]> | null) ?? {},
        variations: (profile?.product_variations as Record<string, string[]> | null) ?? {},
      })
    }

    void loadProfessionalTags()

    return () => {
      active = false
    }
  }, [])

  const activeSubtypes = filterType !== 'todos'
    ? PRODUCT_SUBTYPES[filterType as ProductType]
    : []

  function handleTypeChange(type: string) {
    setFilterType(type)
    setFilterSubtype('todos')
  }

  const filtered = orders.filter(o => {
    const matchSearch = o.clientName.toLowerCase().includes(search.toLowerCase()) || o.productType.toLowerCase().includes(search.toLowerCase()) || o.productSubtype.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'todos' || o.productType === filterType
    const matchSubtype = filterSubtype === 'todos' || o.productSubtype === filterSubtype
    return matchSearch && matchType && matchSubtype
  })

  const counts: Record<string, number> = {
    todos: orders.length,
    Bolo: orders.filter(o => o.productType === 'Bolo').length,
    Doces: orders.filter(o => o.productType === 'Doces').length,
    Salgados: orders.filter(o => o.productType === 'Salgados').length,
    'Refeição': orders.filter(o => o.productType === 'Refeição').length,
  }

  return (
    <div className="space-y-5">
      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} tags={professionalTags} />}

      <div>
        <h1 className="text-xl font-bold text-white">Pedidos</h1>
        <p className="text-sm text-gray-400">{orders.length} pedidos no total</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {([
          ['todos',     'Todos',     '🎊'],
          ['Bolo',      'Bolos',     '🎂'],
          ['Doces',     'Doces',     '🍬'],
          ['Salgados',  'Salgados',  '🥐'],
          ['Refeição',  'Refeição',  '�'],
        ] as const).map(([key, label, emoji]) => (
          <button
            key={key}
            onClick={() => handleTypeChange(key)}
            className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-colors border ${
              filterType === key
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20'
            }`}
          >
            <span>{emoji}</span>
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterType === key ? 'bg-primary/30' : 'bg-white/10'}`}>
              {counts[key]}
            </span>
          </button>
        ))}
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
          className="w-full h-10 rounded-xl border border-white/10 bg-black/30 pl-9 pr-4 text-sm text-gray-100 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setShowRegister(true)}
          className="card flex flex-col items-center justify-center gap-3 p-5 min-h-[140px] border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-dashed border-primary/50 group-hover:border-primary transition-colors">
            <Plus className="h-6 w-6 text-primary/60 group-hover:text-primary transition-colors" />
          </div>
          <span className="text-sm font-medium text-primary/60 group-hover:text-primary transition-colors">Novo Pedido</span>
        </button>

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-500">Nenhum pedido encontrado.</div>
        )}
        {filtered.map(o => {
          const recipe = RECIPE_MAP[o.productType] ?? RECIPE_MAP['Bolo']
          const status = STATUS_CONFIG[o.status]
          return (
            <div
              key={o.id}
              onClick={() => setSelected(o)}
              className="p-4 flex flex-col gap-3 cursor-pointer transition-colors group min-h-[140px] rounded-xl border border-violet-500/20 bg-violet-900/30 hover:bg-violet-800/40"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-xl shrink-0">
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

              <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-white/5 pt-2">
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

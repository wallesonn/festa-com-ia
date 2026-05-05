"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { PRODUCT_GROUPS, type ProductType } from '@/lib/types'

type TagsMap = Record<string, string[]>

type ProfileData = {
  id: string
  products_produced: string | null
  product_subgroups: TagsMap | null
  product_variations: TagsMap | null
}

type TagSuggestion = {
  subgroups: string[]
  variations: string[]
}

const COMMON_VARIATION_SUGGESTIONS = ['Consumo Dia Seguinte']

const PRODUCT_TAG_SUGGESTIONS: Record<ProductType, TagSuggestion> = {
  Bolo: {
    subgroups: ['Tradicional', 'Recheado', 'Decorado', 'Naked Cake', 'Mini bolo'],
    variations: ['Chocolate', 'Red Velvet', 'Morango', 'Limão', 'Baunilha', 'Massa de cenoura', ...COMMON_VARIATION_SUGGESTIONS],
  },
  Doces: {
    subgroups: ['Brigadeiros', 'Docinhos de festa', 'Doces finos', 'Sobremesas', 'Copinhos'],
    variations: ['Brigadeiro', 'Beijinho', 'Bicho-de-pé', 'Cajuzinho', 'Palha Italiana', 'Doce de leite', ...COMMON_VARIATION_SUGGESTIONS],
  },
  Salgados: {
    subgroups: ['Fritos', 'Assados', 'Mini porções', 'Gourmet', 'Kits de salgados'],
    variations: ['Coxinha', 'Enroladinho', 'Mini-quiche', 'Kibe', 'Bolinha de Queijo', 'Empanado leve', ...COMMON_VARIATION_SUGGESTIONS],
  },
  Refeição: {
    subgroups: ['Feijoadas', 'Tortas', 'Lasanhas', 'Pratos executivos', 'Pratos caseiros'],
    variations: ['Feijoada', 'Lasanha', 'Prato executivo', 'Arroz carreteiro', 'Porção individual', 'Travessa familiar', ...COMMON_VARIATION_SUGGESTIONS],
  },
}

function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function dedupeTags(values: string[]) {
  return Array.from(new Set(values.map(normalizeTag).filter(Boolean)))
}

function parseProductsProduced(value: string | null | undefined) {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    }
  } catch {
    // fallback para legado em texto livre
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function isProductType(value: string): value is ProductType {
  return PRODUCT_GROUPS.includes(value as ProductType)
}

export default function ProdutosPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [professionalId, setProfessionalId] = useState('')
  const [productsProduced, setProductsProduced] = useState<ProductType[]>([])
  const [subgroupsMap, setSubgroupsMap] = useState<TagsMap>({})
  const [variationsMap, setVariationsMap] = useState<TagsMap>({})
  const [subgroupInputs, setSubgroupInputs] = useState<Record<string, string>>({})
  const [variationInputs, setVariationInputs] = useState<Record<string, string>>({})
  const router = useRouter()

  useEffect(() => {
    let active = true

    async function loadProfile() {
      setLoading(true)
      setError(null)

      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (!active) return

      if (authError || !authData.user) {
        router.replace('/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('festa-com-ia-professionals')
        .select('id,products_produced,product_subgroups,product_variations')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle<ProfileData>()

      if (!active) return

      if (profileError) {
        setError(profileError.message)
      }

      if (!profile) {
        router.replace('/perfil')
        return
      }

      setProfessionalId(profile.id)
      setProductsProduced(parseProductsProduced(profile.products_produced).filter(isProductType))
      setSubgroupsMap(profile.product_subgroups ?? {})
      setVariationsMap(profile.product_variations ?? {})
      setLoading(false)
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [router])

  const activeGroups = productsProduced.length > 0 ? productsProduced : PRODUCT_GROUPS

  function addSubgroup(group: string) {
    const value = normalizeTag(subgroupInputs[group] ?? '')
    if (!value) return
    setSubgroupsMap((current) => ({
      ...current,
      [group]: dedupeTags([...(current[group] ?? []), value]),
    }))
    setSubgroupInputs((current) => ({ ...current, [group]: '' }))
  }

  function removeSubgroup(group: string, tag: string) {
    setSubgroupsMap((current) => ({
      ...current,
      [group]: (current[group] ?? []).filter((t) => t !== tag),
    }))
  }

  function addVariation(group: string) {
    const value = normalizeTag(variationInputs[group] ?? '')
    if (!value) return
    setVariationsMap((current) => ({
      ...current,
      [group]: dedupeTags([...(current[group] ?? []), value]),
    }))
    setVariationInputs((current) => ({ ...current, [group]: '' }))
  }

  function removeVariation(group: string, tag: string) {
    setVariationsMap((current) => ({
      ...current,
      [group]: (current[group] ?? []).filter((t) => t !== tag),
    }))
  }

  function addSuggestedSubgroup(group: string, tag: string) {
    setSubgroupsMap((current) => ({
      ...current,
      [group]: dedupeTags([...(current[group] ?? []), tag]),
    }))
  }

  function addSuggestedVariation(group: string, tag: string) {
    setVariationsMap((current) => ({
      ...current,
      [group]: dedupeTags([...(current[group] ?? []), tag]),
    }))
  }

  async function handleSave() {
    if (!professionalId) {
      setError('ID do profissional não encontrado. Recarregue a página.')
      return
    }

    setSaving(true)
    setError(null)
    setFeedback(null)

    try {
      const { error: updateError } = await supabase
        .from('festa-com-ia-professionals')
        .update({
          product_subgroups: subgroupsMap,
          product_variations: variationsMap,
          updated_at: new Date().toISOString(),
        })
        .eq('id', professionalId)

      if (updateError) {
        setError(updateError.message)
        return
      }

      setFeedback('Tags salvas com sucesso.')
    } catch {
      setError('Erro ao salvar. Verifique a conexão e tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-400">Carregando cadastro de produtos...</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-fuchsia-500/20 via-white/5 to-violet-500/15 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_42%)]" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.28em] text-gray-200">
                Cadastro de produtos
              </div>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">Linhas e variações</h1>
              <p className="max-w-xl text-sm leading-6 text-gray-200/80 sm:text-base">
                Cadastre as tags por grupo de produto. No formulário de pedido, só aparecerão as opções do tipo selecionado.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">
              {activeGroups.length} grupo{activeGroups.length !== 1 ? 's' : ''} ativo{activeGroups.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {activeGroups.map((group) => {
        const suggestion = PRODUCT_TAG_SUGGESTIONS[group]
        const groupSubgroups = subgroupsMap[group] ?? []
        const groupVariations = variationsMap[group] ?? []

        return (
          <div key={group} className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="border-b border-white/10 px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-white">{group}</h2>
                <div className="flex gap-2 text-xs text-gray-400">
                  <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
                    {groupSubgroups.length} linha{groupSubgroups.length !== 1 ? 's' : ''}
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
                    {groupVariations.length} variação{groupVariations.length !== 1 ? 'ões' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-0 divide-y divide-white/10 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">Linhas</p>
                  <p className="mt-1 text-xs text-gray-500">Ex: Brigadeiros, Tortas, Feijoadas.</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {suggestion.subgroups.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addSuggestedSubgroup(group, tag)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        groupSubgroups.includes(tag)
                          ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                          : 'border-white/10 bg-black/20 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={subgroupInputs[group] ?? ''}
                    onChange={(e) => setSubgroupInputs((c) => ({ ...c, [group]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSubgroup(group)
                      }
                    }}
                    className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/60 focus:ring-1 focus:ring-fuchsia-500/30"
                    placeholder="Adicionar linha"
                  />
                  <button
                    type="button"
                    onClick={() => addSubgroup(group)}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 px-3 text-white transition hover:bg-white/15"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex min-h-8 flex-wrap gap-2">
                  {groupSubgroups.length > 0 ? (
                    groupSubgroups.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-xs text-fuchsia-100">
                        {tag}
                        <button type="button" onClick={() => removeSubgroup(group, tag)} className="rounded-full p-0.5 text-fuchsia-100/70 hover:text-white">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">Nenhuma linha cadastrada.</span>
                  )}
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">Variações</p>
                  <p className="mt-1 text-xs text-gray-500">Ex: massa de chocolate, cobertura de ganache.</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {suggestion.variations.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addSuggestedVariation(group, tag)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        groupVariations.includes(tag)
                          ? 'border-violet-400/30 bg-violet-500/10 text-violet-100'
                          : 'border-white/10 bg-black/20 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={variationInputs[group] ?? ''}
                    onChange={(e) => setVariationInputs((c) => ({ ...c, [group]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addVariation(group)
                      }
                    }}
                    className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/60 focus:ring-1 focus:ring-fuchsia-500/30"
                    placeholder="Adicionar variação"
                  />
                  <button
                    type="button"
                    onClick={() => addVariation(group)}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 px-3 text-white transition hover:bg-white/15"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex min-h-8 flex-wrap gap-2">
                  {groupVariations.length > 0 ? (
                    groupVariations.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-100">
                        {tag}
                        <button type="button" onClick={() => removeVariation(group, tag)} className="rounded-full p-0.5 text-violet-100/70 hover:text-white">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">Nenhuma variação cadastrada.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      <div className="space-y-3">
        {feedback && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            {feedback}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={handleSave}
            className="h-12 rounded-2xl border border-white/10 bg-gradient-to-r from-fuchsia-500 via-fuchsia-500 to-violet-500 px-5 text-base shadow-[0_18px_50px_rgba(168,85,247,0.35)] transition-transform duration-300 hover:scale-[1.01]"
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar tags'}
          </Button>
          <button
            type="button"
            onClick={() => router.push('/perfil')}
            className="h-12 rounded-2xl border border-white/10 bg-white/5 px-5 text-base text-gray-200 transition hover:bg-white/10"
          >
            Voltar ao perfil
          </button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { PRODUCT_GROUPS, type ProductType } from '@/lib/types'

type ProfileData = {
  id: string
  business_name: string | null
  products_produced: string | null
  product_subgroups: string[] | null
  product_variations: string[] | null
}

type TagSuggestion = {
  subgroups: string[]
  variations: string[]
}

const PRODUCT_TAG_SUGGESTIONS: Record<ProductType, TagSuggestion> = {
  Bolo: {
    subgroups: ['Tradicional', 'Recheado', 'Decorado', 'Naked Cake', 'Mini bolo'],
    variations: ['Chocolate', 'Red Velvet', 'Morango', 'Limão', 'Baunilha', 'Massa de cenoura'],
  },
  Doces: {
    subgroups: ['Brigadeiros', 'Docinhos de festa', 'Doces finos', 'Sobremesas', 'Copinhos'],
    variations: ['Brigadeiro', 'Beijinho', 'Bicho-de-pé', 'Cajuzinho', 'Palha Italiana', 'Doce de leite'],
  },
  Salgados: {
    subgroups: ['Fritos', 'Assados', 'Mini porções', 'Gourmet', 'Kits de salgados'],
    variations: ['Coxinha', 'Enroladinho', 'Mini-quiche', 'Kibe', 'Bolinha de Queijo', 'Empanado leve'],
  },
  Refeição: {
    subgroups: ['Feijoadas', 'Tortas', 'Lasanhas', 'Pratos executivos', 'Pratos caseiros'],
    variations: ['Feijoada', 'Lasanha', 'Prato executivo', 'Arroz carreteiro', 'Porção individual', 'Travessa familiar'],
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
  const [businessName, setBusinessName] = useState('')
  const [productsProduced, setProductsProduced] = useState<ProductType[]>([])
  const [subgroupInput, setSubgroupInput] = useState('')
  const [variationInput, setVariationInput] = useState('')
  const [subgroups, setSubgroups] = useState<string[]>([])
  const [variations, setVariations] = useState<string[]>([])
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
        .select('id,business_name,products_produced,product_subgroups,product_variations')
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
      setBusinessName(profile.business_name ?? '')
      setProductsProduced(parseProductsProduced(profile.products_produced).filter(isProductType))
      setSubgroups(dedupeTags(profile.product_subgroups ?? []))
      setVariations(dedupeTags(profile.product_variations ?? []))
      setLoading(false)
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [router])

  function addSubgroup() {
    const value = normalizeTag(subgroupInput)
    if (!value) return
    setSubgroups((current) => dedupeTags([...current, value]))
    setSubgroupInput('')
  }

  function addVariation() {
    const value = normalizeTag(variationInput)
    if (!value) return
    setVariations((current) => dedupeTags([...current, value]))
    setVariationInput('')
  }

  function removeSubgroup(tag: string) {
    setSubgroups((current) => current.filter((item) => item !== tag))
  }

  function removeVariation(tag: string) {
    setVariations((current) => current.filter((item) => item !== tag))
  }

  function addSuggestedSubgroup(tag: string) {
    setSubgroups((current) => dedupeTags([...current, tag]))
  }

  function addSuggestedVariation(tag: string) {
    setVariations((current) => dedupeTags([...current, tag]))
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!professionalId) return

    setSaving(true)
    setError(null)
    setFeedback(null)

    const payload = {
      product_subgroups: dedupeTags(subgroups),
      product_variations: dedupeTags(variations),
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('festa-com-ia-professionals')
      .update(payload)
      .eq('id', professionalId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setFeedback('Tags salvas com sucesso.')
    setSaving(false)
  }

  if (loading) {
    return <div className="text-sm text-gray-400">Carregando cadastro de produtos...</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden bg-gradient-to-br from-fuchsia-500/20 via-white/5 to-violet-500/15 p-6 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_42%)]" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.28em] text-gray-200">
                Cadastro de produtos
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">Subgrupos e variações</h1>
                <p className="max-w-xl text-sm leading-6 text-gray-200/80 sm:text-base">
                  Cadastre as tags que serão usadas no formulário de novo pedido. Essas opções ficam salvas por profissional e podem ser ajustadas a qualquer momento.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Empresa', value: businessName || 'Sem nome cadastrado' },
                  { label: 'Subgrupos', value: `${subgroups.length}` },
                  { label: 'Variações', value: `${variations.length}` },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-200">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{item.label}</p>
                    <p className="mt-1 font-medium text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-300">
                <p className="font-medium text-white">Como isso é usado</p>
                <p className="mt-1 text-gray-300/90">
                  O modal de novo pedido consulta esses campos para montar os dropdowns de subgrupo e variação.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-300">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">Sugestões baseadas nos seus grupos</p>
                    <p className="mt-1 text-gray-300/90">Clique em uma sugestão para incluir no cadastro.</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
                    {productsProduced.length > 0 ? `${productsProduced.length} grupos cadastrados` : 'Usando grupos padrão'}
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  {(productsProduced.length > 0 ? productsProduced : PRODUCT_GROUPS).map((group) => {
                    const suggestion = PRODUCT_TAG_SUGGESTIONS[group]

                    return (
                      <div key={group} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">{group}</p>
                            <p className="text-xs text-gray-400">Subgrupos e variações mais usados</p>
                          </div>
                          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gray-400">
                            Sugestão
                          </span>
                        </div>

                        <div className="mt-4 space-y-4">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Subgrupos</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {suggestion.subgroups.map((tag) => {
                                const selected = subgroups.includes(tag)

                                return (
                                  <button
                                    key={`${group}-subgroup-${tag}`}
                                    type="button"
                                    onClick={() => addSuggestedSubgroup(tag)}
                                    className={`rounded-full border px-3 py-1 text-xs transition ${selected ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-black/20 text-gray-200 hover:bg-white/10'}`}
                                  >
                                    {tag}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Variações</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {suggestion.variations.map((tag) => {
                                const selected = variations.includes(tag)

                                return (
                                  <button
                                    key={`${group}-variation-${tag}`}
                                    type="button"
                                    onClick={() => addSuggestedVariation(tag)}
                                    className={`rounded-full border px-3 py-1 text-xs transition ${selected ? 'border-violet-400/30 bg-violet-500/10 text-violet-100' : 'border-white/10 bg-black/20 text-gray-200 hover:bg-white/10'}`}
                                  >
                                    {tag}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid gap-5">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-white">Subgrupos</h2>
                      <p className="text-xs text-gray-400">Ex: Brigadeiros, Tortas, Feijoadas.</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-300">{subgroups.length}</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={subgroupInput}
                      onChange={(e) => setSubgroupInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSubgroup()
                        }
                      }}
                      className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                      placeholder="Adicionar subgrupo"
                    />
                    <button
                      type="button"
                      onClick={addSubgroup}
                      className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white transition hover:bg-white/15"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {subgroups.length > 0 ? (
                      subgroups.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-xs text-fuchsia-100">
                          {tag}
                          <button type="button" onClick={() => removeSubgroup(tag)} className="rounded-full p-0.5 text-fuchsia-100/80 hover:bg-fuchsia-500/20 hover:text-white">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">Nenhum subgrupo cadastrado.</span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-white">Variações</h2>
                      <p className="text-xs text-gray-400">Ex: tradicional, massa de chocolate, cobertura de ganache.</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-300">{variations.length}</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={variationInput}
                      onChange={(e) => setVariationInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addVariation()
                        }
                      }}
                      className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                      placeholder="Adicionar variação"
                    />
                    <button
                      type="button"
                      onClick={addVariation}
                      className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white transition hover:bg-white/15"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {variations.length > 0 ? (
                      variations.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-100">
                          {tag}
                          <button type="button" onClick={() => removeVariation(tag)} className="rounded-full p-0.5 text-violet-100/80 hover:bg-violet-500/20 hover:text-white">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">Nenhuma variação cadastrada.</span>
                    )}
                  </div>
                </div>
              </div>

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

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  type="submit"
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
            </form>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
        <p>
          Dica: você pode cadastrar tags curtas e objetivas. O sistema vai reutilizar exatamente o que estiver salvo aqui no formulário de pedidos.
        </p>
      </div>
    </div>
  )
}

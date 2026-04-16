"use client"

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { PRODUCT_GROUPS } from '@/lib/types'

const STORAGE_BUCKET = 'festa-com-ia'

type RulesBuilderState = {
  hours: 'horario_comercial' | 'manha' | 'tarde' | 'noite' | 'sob_consulta'
  delivery: 'sim' | 'nao' | 'depende' | 'somente_retirada'
  cakes: boolean
  sweets: boolean
  meals: boolean
  savory: boolean
  lactoseFree: boolean
  glutenFree: boolean
  sugarFree: boolean
  veganOptions: boolean
  customNotes: string
}

const RULES_HOURS_OPTIONS = [
  {
    value: 'horario_comercial',
    label: 'Horário comercial',
    hint: 'Atende em horário comercial',
  },
  {
    value: 'manha',
    label: 'Manhã',
    hint: 'Atende pela manhã',
  },
  {
    value: 'tarde',
    label: 'Tarde',
    hint: 'Atende à tarde',
  },
  {
    value: 'noite',
    label: 'Noite',
    hint: 'Atende à noite',
  },
  {
    value: 'sob_consulta',
    label: 'Sob consulta',
    hint: 'Horário flexível, conforme combinado',
  },
] as const

const RULES_DELIVERY_OPTIONS = [
  { value: 'sim', label: 'Sim', hint: 'Faz delivery' },
  { value: 'nao', label: 'Não', hint: 'Não faz delivery' },
  { value: 'depende', label: 'Depende', hint: 'Depende do produto ou da região' },
  { value: 'somente_retirada', label: 'Somente retirada', hint: 'Funciona apenas por retirada' },
] as const

const RULES_PRODUCT_OPTIONS = [
  { key: 'cakes' as const, label: 'Bolos e tortas', hint: 'Bolos de festa, bolos caseiros e tortas' },
  { key: 'sweets' as const, label: 'Doces e sobremesas', hint: 'Brigadeiros, brownies, pudins e afins' },
  { key: 'meals' as const, label: 'Refeições', hint: 'Marmitas, pratos feitos e refeições completas' },
  { key: 'savory' as const, label: 'Salgados', hint: 'Lanches, salgadinhos e itens de festa' },
] as const

const RULES_DIETARY_OPTIONS = [
  { key: 'lactoseFree' as const, label: 'Sem lactose', hint: 'Opções sem leite ou derivados' },
  { key: 'glutenFree' as const, label: 'Sem glúten', hint: 'Opções sem trigo ou glúten' },
  { key: 'sugarFree' as const, label: 'Sem açúcar', hint: 'Opções diet ou sem açúcar' },
  { key: 'veganOptions' as const, label: 'Veganas', hint: 'Opções sem ingredientes de origem animal' },
] as const

const DEFAULT_RULES_BUILDER: RulesBuilderState = {
  hours: 'horario_comercial',
  delivery: 'depende',
  cakes: true,
  sweets: true,
  meals: false,
  savory: false,
  lactoseFree: false,
  glutenFree: false,
  sugarFree: false,
  veganOptions: false,
  customNotes: '',
}

function joinPortugueseList(items: string[]) {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} e ${items[1]}`

  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`
}

function buildServiceRulesText(builder: RulesBuilderState) {
  const hoursLabel = RULES_HOURS_OPTIONS.find((option) => option.value === builder.hours)?.label ?? 'Horário comercial'
  const deliveryLabel = RULES_DELIVERY_OPTIONS.find((option) => option.value === builder.delivery)?.label ?? 'Depende'

  const products = [
    builder.cakes ? 'bolos e tortas' : null,
    builder.sweets ? 'doces e sobremesas' : null,
    builder.meals ? 'refeições' : null,
    builder.savory ? 'salgados' : null,
  ].filter((item): item is string => Boolean(item))

  const dietaryOptions = [
    builder.lactoseFree ? 'sem lactose' : null,
    builder.glutenFree ? 'sem glúten' : null,
    builder.sugarFree ? 'sem açúcar' : null,
    builder.veganOptions ? 'opções veganas' : null,
  ].filter((item): item is string => Boolean(item))

  const lines = [
    'Regras de atendimento:',
    `- Horário de atendimento: ${hoursLabel.toLowerCase()}.`,
    `- Delivery: ${deliveryLabel.toLowerCase()}.`,
    products.length ? `- Trabalha com ${joinPortugueseList(products)}.` : '- Tipos de produto a confirmar conforme o pedido.',
    dietaryOptions.length
      ? `- Oferece ${joinPortugueseList(dietaryOptions)}.`
      : '- Restrições alimentares e versões especiais a confirmar conforme o item.',
    builder.customNotes.trim() ? `- Observações extras: ${builder.customNotes.trim()}.` : null,
  ]

  return lines.filter((line): line is string => Boolean(line)).join('\n')
}

type ProfileForm = {
  businessName: string
  phone: string
  productsProduced: string[]
  conversationSamples: string
  serviceRules: string
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

export default function PerfilPage() {
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [professionalId, setProfessionalId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isFirstAccess, setIsFirstAccess] = useState(false)
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false)
  const [rulesBuilder, setRulesBuilder] = useState<RulesBuilderState>(DEFAULT_RULES_BUILDER)
  const [form, setForm] = useState<ProfileForm>({
    businessName: '',
    phone: '',
    productsProduced: [],
    conversationSamples: '',
    serviceRules: '',
  })
  const router = useRouter()

  const normalizedEmail = useMemo(() => email.trim().toLowerCase().replace(/@/g, '-').replace(/\./g, '-'), [email])
  const currentPhotoUrl = useMemo(() => {
    if (!photoPath) return ''
    return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(photoPath).data.publicUrl
  }, [photoPath])

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(photoFile)
    setPhotoPreview(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [photoFile])

  function buildPhotoPath(filename: string) {
    const safeFileName = filename.replace(/\s+/g, '-').toLowerCase()
    return `${normalizedEmail}/profile-${Date.now()}-${safeFileName}`
  }

  useEffect(() => {
    let active = true

    async function loadUser() {
      setLoading(true)
      setError(null)

      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (!active) return

      if (authError || !authData.user) {
        router.replace('/login')
        return
      }

      const user = authData.user
      setUserId(user.id)

      const { data: profile, error: profileError } = await supabase
        .from('festa-com-ia-professionals')
        .select('id,business_name,phone,email,photo_path,products_produced,conversation_samples,service_rules,onboarding_completed')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (!active) return

      if (profileError) {
        setError(profileError.message)
      }

      const selectedProducts = parseProductsProduced(profile?.products_produced)
      const firstAccess =
        !profile ||
        !profile.onboarding_completed

      setIsFirstAccess(firstAccess)
      setProfessionalId(profile?.id ?? '')
      setEmail(profile?.email ?? user.email ?? '')
      setPhotoPath(profile?.photo_path ?? null)
      setForm({
        businessName: profile?.business_name ?? '',
        phone: profile?.phone ?? '',
        productsProduced: selectedProducts,
        conversationSamples: profile?.conversation_samples ?? '',
        serviceRules: profile?.service_rules ?? '',
      })
      setLoading(false)
    }

    loadUser()

    return () => {
      active = false
    }
  }, [router])

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!userId) return

    if (form.productsProduced.length === 0) {
      setError('Selecione ao menos um grupo de produto.')
      return
    }

    setSaving(true)
    setFeedback(null)
    setError(null)

    if (!normalizedEmail) {
      setError('Não foi possível identificar o email do profissional para salvar a foto.')
      setSaving(false)
      return
    }

    let nextPhotoPath = photoPath
    let uploadedPhotoPath: string | null = null

    if (photoFile) {
      const extension = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      nextPhotoPath = buildPhotoPath(`photo.${extension}`)

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(nextPhotoPath, photoFile, {
          upsert: true,
          contentType: photoFile.type || 'image/jpeg',
          cacheControl: '3600',
        })

      if (uploadError) {
        setError(uploadError.message)
        setSaving(false)
        return
      }

      uploadedPhotoPath = nextPhotoPath
    }

    const now = new Date().toISOString()
    const payload = {
      auth_user_id: userId,
      display_name: form.businessName.trim(),
      business_name: form.businessName.trim(),
      phone: form.phone.trim() || null,
      email: email.trim() || null,
      photo_path: nextPhotoPath,
      products_produced: JSON.stringify(form.productsProduced),
      conversation_samples: form.conversationSamples.trim() || null,
      service_rules: form.serviceRules.trim() || null,
      onboarding_completed: true,
      status: 'active',
      updated_at: now,
    }

    if (professionalId) {
      const { error: updateError } = await supabase
        .from('festa-com-ia-professionals')
        .update(payload)
        .eq('id', professionalId)

      if (updateError) {
        setError(updateError.message)
        if (uploadedPhotoPath) {
          await supabase.storage.from(STORAGE_BUCKET).remove([uploadedPhotoPath])
        }
        setSaving(false)
        return
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('festa-com-ia-professionals')
        .insert(payload)
        .select('id')
        .single()

      if (insertError) {
        setError(insertError.message)
        if (uploadedPhotoPath) {
          await supabase.storage.from(STORAGE_BUCKET).remove([uploadedPhotoPath])
        }
        setSaving(false)
        return
      }

      setProfessionalId(inserted.id)
    }

    if (photoFile && photoPath && photoPath !== nextPhotoPath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([photoPath])
    }

    if (nextPhotoPath) {
      setPhotoPath(nextPhotoPath)
    }
    setPhotoFile(null)
    setPhotoPreview(null)

    // Sinaliza ao AppShell para recarregar a foto no header
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('profile-photo-updated'))
    }

    if (isFirstAccess) {
      router.replace('/')
      router.refresh()
      return
    }

    setFeedback('Perfil atualizado com sucesso.')
    setSaving(false)
  }

  function handleApplyStyleBuilder() {
    setForm((prev) => ({
      ...prev,
      serviceRules: buildServiceRulesText(rulesBuilder),
    }))
    setIsStyleModalOpen(false)
  }

  if (loading) {
    return <div className="text-sm text-gray-400">Carregando seu perfil...</div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden bg-gradient-to-br from-fuchsia-500/20 via-white/5 to-violet-500/15 p-6 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_42%)]" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.28em] text-gray-200">
                Perfil do profissional
              </div>



              <div className="space-y-3">
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                  {isFirstAccess ? 'Complete seu perfil para começar' : 'Seu perfil'}
                </h1>
                <p className="max-w-xl text-sm leading-6 text-gray-200/80 sm:text-base">
                  Use esta área para informar os dados básicos do seu negócio. Isso ajuda a personalizar
                  o app e preparar o primeiro acesso.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shrink-0">
                    {photoPreview || currentPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoPreview || currentPhotoUrl}
                        alt="Foto do profissional ou da empresa"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                        Sem foto
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-white">Foto do profissional / empresa</p>
                      <p className="text-xs text-gray-400">
                        A imagem será salva em <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">{STORAGE_BUCKET}/{normalizedEmail || '...'}</code>
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
                      className="block w-full max-w-sm text-xs text-gray-300 file:mr-4 file:rounded-xl file:border-0 file:bg-fuchsia-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-fuchsia-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  'Nome da empresa',
                  'WhatsApp',
                  'Grupos de produtos',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-200">
                    {item}
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-300">
                <p className="font-medium text-white">Grupos selecionados</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.productsProduced.length > 0 ? (
                    form.productsProduced.map((group) => (
                      <span key={group} className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-xs text-fuchsia-100">
                        {group}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">Nenhum grupo selecionado</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-300">
                <p className="font-medium text-white">Email de acesso</p>
                <p className="mt-1 break-all text-gray-300">{email}</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="businessName" className="text-sm font-medium text-gray-200">
                  Nome da empresa
                </label>
                <input
                  id="businessName"
                  value={form.businessName}
                  onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                  placeholder="Doceria da Maria"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-200">
                  WhatsApp
                </label>
                <input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                  placeholder="(11) 99999-0000"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">
                  Grupos de produtos
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PRODUCT_GROUPS.map((group) => {
                    const selected = form.productsProduced.includes(group)
                    return (
                      <button
                        key={group}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            productsProduced: selected
                              ? prev.productsProduced.filter((item) => item !== group)
                              : [...prev.productsProduced, group],
                          }))
                        }}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 ${
                          selected
                            ? 'border-fuchsia-400/50 bg-fuchsia-500/15 text-white shadow-[0_0_0_1px_rgba(217,70,239,0.25)]'
                            : 'border-white/10 bg-white/5 text-gray-200 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <span>{group}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] ${selected ? 'bg-fuchsia-400/20 text-fuchsia-100' : 'bg-white/10 text-gray-400'}`}>
                          {selected ? 'Selecionado' : 'Selecionar'}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400">
                  Selecione apenas os grupos que você produz. As linhas e variações serão usadas depois como tags nos pedidos.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="conversationSamples" className="text-sm font-medium text-gray-200">
                  Exemplo de conversa (cole o texto de pelo menos três conversas)
                </label>
                <textarea
                  id="conversationSamples"
                  value={form.conversationSamples}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, conversationSamples: event.target.value }))
                  }
                  rows={5}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                  placeholder="Cole aqui o texto completo de três ou mais conversas estilo WhatsApp"
                />
                <p className="text-xs text-gray-400">
                  Use este campo para colar o conteúdo real das conversas. Emojis, gírias e o ritmo de atendimento ajudam a IA a imitar seu jeito.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="serviceRules" className="text-sm font-medium text-gray-200">
                    Regras de atendimento
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsStyleModalOpen(true)}
                    className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-medium text-fuchsia-100 transition hover:border-fuchsia-300 hover:bg-fuchsia-500/20"
                  >
                    Montar regras
                  </button>
                </div>
                <textarea
                  id="serviceRules"
                  value={form.serviceRules}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, serviceRules: event.target.value }))
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                  placeholder="Clique em 'Montar regras' para gerar regras simples do negócio, ou edite manualmente aqui."
                />
                <p className="text-xs text-gray-400">
                  Essas regras podem orientar a IA no atendimento e evitar respostas fora da política do negócio.
                </p>
              </div>

              {feedback && (
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
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
                  disabled={saving || form.productsProduced.length === 0}
                >
                  {saving ? 'Salvando...' : isFirstAccess ? 'Concluir perfil' : 'Salvar alterações'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {isStyleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-300/80">Regras de atendimento</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Monte as regras do seu negócio</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
                  Selecione horários, delivery, tipos de produtos e restrições alimentares para gerar um texto pronto
                  com as regras do seu atendimento.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStyleModalOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-white/20 hover:bg-white/10"
              >
                Fechar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-gray-200">
                <span className="font-medium">Horário de atendimento</span>
                <select
                  value={rulesBuilder.hours}
                  onChange={(event) =>
                    setRulesBuilder((prev) => ({ ...prev, hours: event.target.value as RulesBuilderState['hours'] }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                >
                  {RULES_HOURS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-950">
                      {option.label} — {option.hint}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm text-gray-200">
                <span className="font-medium">Delivery</span>
                <select
                  value={rulesBuilder.delivery}
                  onChange={(event) =>
                    setRulesBuilder((prev) => ({ ...prev, delivery: event.target.value as RulesBuilderState['delivery'] }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                >
                  {RULES_DELIVERY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-950">
                      {option.label} — {option.hint}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-sm font-medium text-white">Tipos de produtos</p>
              <div className="grid gap-3 md:grid-cols-2">
                {RULES_PRODUCT_OPTIONS.map((item) => (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <input
                      type="checkbox"
                      checked={rulesBuilder[item.key]}
                      onChange={(event) =>
                        setRulesBuilder((prev) => ({ ...prev, [item.key]: event.target.checked }))
                      }
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-fuchsia-500 focus:ring-fuchsia-500/40"
                    />
                    <span>
                      <span className="block font-medium text-white">{item.label}</span>
                      <span className="mt-1 block text-xs text-gray-400">{item.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-sm font-medium text-white">Restrições e versões especiais</p>
              <div className="grid gap-3 md:grid-cols-2">
                {RULES_DIETARY_OPTIONS.map((item) => (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <input
                      type="checkbox"
                      checked={rulesBuilder[item.key]}
                      onChange={(event) =>
                        setRulesBuilder((prev) => ({ ...prev, [item.key]: event.target.checked }))
                      }
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-fuchsia-500 focus:ring-fuchsia-500/40"
                    />
                    <span>
                      <span className="block font-medium text-white">{item.label}</span>
                      <span className="mt-1 block text-xs text-gray-400">{item.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <label htmlFor="rulesCustomNotes" className="text-sm font-medium text-gray-200">
                Observações extras
              </label>
              <textarea
                id="rulesCustomNotes"
                value={rulesBuilder.customNotes}
                onChange={(event) =>
                  setRulesBuilder((prev) => ({ ...prev, customNotes: event.target.value }))
                }
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                placeholder="Ex.: atende apenas sob encomenda, prazo mínimo de 2 dias, entrega em bairros específicos..."
              />
              <p className="text-xs text-gray-400">
                Use este campo para regras adicionais específicas do seu negócio.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">Prévia das regras geradas</p>
                <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-fuchsia-100">
                  Preview
                </span>
              </div>
              <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-white/5 bg-white/5 p-4 text-sm leading-6 text-gray-200">
{buildServiceRulesText(rulesBuilder)}
              </pre>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsStyleModalOpen(false)}
                className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-gray-200 transition hover:border-white/20 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyStyleBuilder}
                className="h-11 rounded-2xl border border-fuchsia-400/30 bg-gradient-to-r from-fuchsia-500 via-fuchsia-500 to-violet-500 px-4 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(168,85,247,0.3)] transition hover:scale-[1.01]"
              >
                OK, usar este texto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

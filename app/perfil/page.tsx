"use client"

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { PRODUCT_GROUPS } from '@/lib/types'

type ProfileForm = {
  businessName: string
  phone: string
  productsProduced: string[]
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
  const [form, setForm] = useState<ProfileForm>({
    businessName: '',
    phone: '',
    productsProduced: [],
  })
  const router = useRouter()

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
        .select('id,business_name,phone,email,products_produced,onboarding_completed')
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
      setForm({
        businessName: profile?.business_name ?? '',
        phone: profile?.phone ?? '',
        productsProduced: selectedProducts,
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

    const now = new Date().toISOString()
    const payload = {
      auth_user_id: userId,
      display_name: form.businessName.trim(),
      business_name: form.businessName.trim(),
      phone: form.phone.trim() || null,
      email: email.trim() || null,
      products_produced: JSON.stringify(form.productsProduced),
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
        setSaving(false)
        return
      }

      setProfessionalId(inserted.id)
    }

    if (isFirstAccess) {
      router.replace('/')
      router.refresh()
      return
    }

    setFeedback('Perfil atualizado com sucesso.')
    setSaving(false)
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
    </div>
  )
}

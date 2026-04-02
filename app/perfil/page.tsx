"use client"

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

type ProfileForm = {
  businessName: string
  phone: string
  productsProduced: string
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
    productsProduced: '',
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
      setEmail(user.email ?? '')
      setUserId(user.id)

      const { data: profile, error: profileError } = await supabase
        .from('festa-com-ia-professionals')
        .select('id,business_name,phone,products_produced')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (!active) return

      if (profileError) {
        setError(profileError.message)
      }

      const firstAccess =
        !profile ||
        !profile.business_name?.trim() ||
        !profile?.phone?.trim() ||
        !profile?.products_produced?.trim()

      setIsFirstAccess(firstAccess)
      setProfessionalId(profile?.id ?? '')
      setForm({
        businessName: profile?.business_name ?? '',
        phone: profile?.phone ?? '',
        productsProduced: profile?.products_produced ?? '',
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

    setSaving(true)
    setFeedback(null)
    setError(null)

    const now = new Date().toISOString()
    const payload = {
      auth_user_id: userId,
      display_name: form.businessName.trim(),
      business_name: form.businessName.trim(),
      phone: form.phone.trim() || null,
      products_produced: form.productsProduced.trim() || null,
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
                  'Produtos produzidos',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-200">
                    {item}
                  </div>
                ))}
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
                <label htmlFor="productsProduced" className="text-sm font-medium text-gray-200">
                  Quais produtos produz
                </label>
                <textarea
                  id="productsProduced"
                  rows={5}
                  value={form.productsProduced}
                  onChange={(e) => setForm((prev) => ({ ...prev, productsProduced: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                  placeholder="Ex.: bolos, doces finos, lembrancinhas, kits festa..."
                  required
                />
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
                  disabled={saving}
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

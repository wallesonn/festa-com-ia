"use client"

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        setError(signUpError.message)
      } else {
        setSuccess(
          'Conta criada! Verifique seu email e clique no link de confirmação antes de entrar.'
        )
        setPassword('')
      }
      setLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(
        signInError.message === 'Email not confirmed'
          ? 'Email ainda não confirmado. Verifique sua caixa de entrada.'
          : signInError.message
      )
      setLoading(false)
      return
    }

    router.replace('/')
    router.refresh()
  }

  const isSignup = mode === 'signup'

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07050d] text-gray-100">
      <style>{`
        @keyframes login-orbit {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          25% { transform: translate3d(18px, -10px, 0) scale(1.03); }
          50% { transform: translate3d(0, -18px, 0) scale(0.98); }
          75% { transform: translate3d(-14px, 8px, 0) scale(1.02); }
          100% { transform: translate3d(0, 0, 0) scale(1); }
        }

        @keyframes login-float {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -14px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }

        @keyframes login-drift {
          0% { transform: translateX(0); }
          50% { transform: translateX(14px); }
          100% { transform: translateX(0); }
        }

        @keyframes login-shimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }

        .login-orbit { animation: login-orbit 18s ease-in-out infinite; }
        .login-float-slow { animation: login-float 8s ease-in-out infinite; }
        .login-float-fast { animation: login-float 5.5s ease-in-out infinite; }
        .login-drift { animation: login-drift 11s ease-in-out infinite; }
        .login-shimmer { animation: login-shimmer 5.5s linear infinite; }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.24),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.18),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,_#130f1f_0%,_#0d0a16_48%,_#07050d_100%)]" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]" />
      <div className="absolute left-[-6rem] top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl login-orbit" />
      <div className="absolute right-[-4rem] top-40 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl login-float-slow" />
      <div className="absolute bottom-[-5rem] left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl login-float-fast" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-8 lg:min-h-[720px] lg:p-10">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_28%,transparent_72%,rgba(255,255,255,0.06))]" />
            <div className="absolute -right-8 top-16 h-40 w-40 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 blur-2xl login-float-slow" />
            <div className="absolute -left-10 bottom-14 h-52 w-52 rounded-full border border-violet-400/20 bg-violet-500/10 blur-2xl login-float-fast" />

            <div className="relative flex h-full flex-col justify-between gap-10">
              <div className="space-y-7">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-gray-200 shadow-lg shadow-fuchsia-950/20">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400/70 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-fuchsia-400" />
                  </span>
                  Festa com IA
                </div>

                <div className="max-w-2xl space-y-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.38em] text-fuchsia-300/90">
                    Gestão inteligente de eventos
                  </p>
                  <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                    Uma plataforma elegante para organizar <span className="bg-gradient-to-r from-fuchsia-300 via-white to-violet-300 bg-clip-text text-transparent">pedidos, clientes e atendimento</span>.
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-gray-300 sm:text-lg">
                    Entre para acessar um ambiente moderno, com login seguro, confirmação por email e
                    uma experiência visual que parece uma landing page premium.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {['Login por email', 'Confirmação de conta', 'Perfil e sessão centralizados'].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0f0b18]/80 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(168,85,247,0.18),_transparent_38%)]" />
                  <div className="relative flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-gray-400">Painel ao vivo</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Visão geral da operação</h2>
                    </div>
                    <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                      Online
                    </div>
                  </div>

                  <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
                    {[
                      { label: 'Pedidos ativos', value: '24', accent: 'from-fuchsia-500/30 to-fuchsia-400/10' },
                      { label: 'Taxa de resposta', value: '98%', accent: 'from-violet-500/30 to-violet-400/10' },
                      { label: 'Clientes hoje', value: '76', accent: 'from-cyan-500/30 to-cyan-400/10' },
                    ].map((stat, index) => (
                      <div
                        key={stat.label}
                        className={`rounded-2xl border border-white/10 bg-gradient-to-br ${stat.accent} p-4 ${index === 1 ? 'login-float-slow' : index === 2 ? 'login-float-fast' : ''}`}
                      >
                        <p className="text-xs uppercase tracking-[0.26em] text-gray-300">{stat.label}</p>
                        <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full w-2/3 rounded-full bg-white/70 login-shimmer" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between text-sm text-gray-300">
                      <span>Atividade recente</span>
                      <span className="text-fuchsia-300">Atualizando agora</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        'Novo pedido confirmado às 14:32',
                        'Mensagem respondida em 4 minutos',
                        'Pagamento aprovado sem ação manual',
                      ].map((line, index) => (
                        <div
                          key={line}
                          className={`flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-3 text-sm text-gray-200 ${index === 0 ? 'login-drift' : ''}`}
                        >
                          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-400 shadow-[0_0_16px_rgba(192,132,252,0.8)]" />
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-200">Por que usar agora</p>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-gray-400">
                        seguro
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        'Entrada com email e senha',
                        'Confirmação por email para novas contas',
                        'Sessão protegida em rotas privadas',
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-3 text-sm text-gray-300">
                          <span className="mt-1 h-2 w-2 rounded-full bg-fuchsia-400" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-fuchsia-500/15 via-white/5 to-violet-500/15 p-5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_45%)]" />
                    <div className="relative flex h-full flex-col justify-between gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-200">Acesso rápido</p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">Entre e continue de onde parou</h3>
                        <p className="mt-3 text-sm leading-6 text-gray-300">
                          A interface guia o usuário com clareza, destaque visual e transições suaves.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        {['Visual premium', 'Fluxo simples', 'Pronto para crescer'].map((item) => (
                          <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-200">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="relative flex items-center">
            <div className="absolute -left-8 top-16 h-28 w-28 rounded-full border border-white/10 bg-white/5 blur-3xl login-float-fast" />
            <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#120e1c]/90 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-fuchsia-500/20 to-transparent opacity-60" />

              <div className="relative mb-6 space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-gray-300">
                  {isSignup ? 'Criar conta' : 'Entrar'}
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold text-white">
                    {isSignup ? 'Abra sua conta' : 'Bem-vindo de volta'}
                  </h2>
                  <p className="text-sm leading-6 text-gray-400">
                    {isSignup
                      ? 'Cadastre-se com email e senha. Um link de confirmação será enviado antes do primeiro acesso.'
                      : 'Faça login com seu email e senha para acessar o painel.'}
                  </p>
                </div>
              </div>

              <div className="relative flex rounded-2xl border border-white/10 bg-black/20 p-1 shadow-inner shadow-black/20">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${mode === 'signin' ? 'bg-white text-[#120e1c] shadow-[0_10px_30px_rgba(255,255,255,0.18)]' : 'text-gray-300 hover:text-white'}`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${mode === 'signup' ? 'bg-white text-[#120e1c] shadow-[0_10px_30px_rgba(255,255,255,0.18)]' : 'text-gray-300 hover:text-white'}`}
                >
                  Criar conta
                </button>
              </div>

              <form className="relative mt-6 space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-200">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                    placeholder="voce@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-200">
                    Senha
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                    placeholder="mínimo 6 caracteres"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-gradient-to-r from-fuchsia-500 via-fuchsia-500 to-violet-500 text-base shadow-[0_18px_50px_rgba(168,85,247,0.35)] transition-transform duration-300 hover:scale-[1.01] hover:from-fuchsia-400 hover:to-violet-400"
                  disabled={loading}
                >
                  {loading ? (isSignup ? 'Criando conta...' : 'Entrando...') : isSignup ? 'Criar conta' : 'Entrar'}
                </Button>

                <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300 sm:grid-cols-2">
                  <div>
                    <p className="font-medium text-white">Novo por aqui?</p>
                    <p className="mt-1 leading-6">Crie sua conta e confirme o email antes de entrar.</p>
                  </div>
                  <div>
                    <p className="font-medium text-white">Já tem acesso?</p>
                    <p className="mt-1 leading-6">Use a aba de login e continue no painel.</p>
                  </div>
                </div>

                <p className="text-center text-xs leading-5 text-gray-400">
                  Ao continuar, você acessa a plataforma com autenticação segura via email.
                </p>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

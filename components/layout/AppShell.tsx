"use client"

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { supabase } from '@/lib/supabase/client'

type ProfileState = {
  onboarding_completed: boolean | null
}

function isProfileComplete(profile: ProfileState | null) {
  return Boolean(profile?.onboarding_completed)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === '/login'

  useEffect(() => {
    let mounted = true

    async function resolveAuthenticatedState(nextSession: Session | null) {
      if (!mounted) return

      setSession(nextSession)

      if (!nextSession) {
        setAuthLoading(false)
        setProfileLoading(false)

        if (!isLoginPage) {
          router.replace('/login')
        }

        return
      }

      setProfileLoading(true)

      const { data: profile } = await supabase
        .from('festa-com-ia-professionals')
        .select('onboarding_completed')
        .eq('auth_user_id', nextSession.user.id)
        .maybeSingle()

      if (!mounted) return

      const complete = isProfileComplete(profile)
      setAuthLoading(false)
      setProfileLoading(false)

      if (isLoginPage) {
        router.replace(complete ? '/' : '/perfil')
        return
      }

      if (!complete && pathname !== '/perfil') {
        router.replace('/perfil')
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      void resolveAuthenticatedState(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void resolveAuthenticatedState(nextSession)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [isLoginPage, pathname, router])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  if (isLoginPage) {
    return <div className="min-h-screen">{children}</div>
  }

  if (authLoading || profileLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-300">
        Verificando sessão e perfil...
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Mobile overlay */}
      <div className={`fixed inset-0 z-40 bg-black/40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`fixed z-50 top-0 left-0 h-full w-[var(--sidebar-width)] bg-card text-gray-100 border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </aside>

      <div className="lg:pl-[var(--sidebar-width)] min-h-screen">
        <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} onSignOut={handleSignOut} />
        <main className="px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}

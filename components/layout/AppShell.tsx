"use client"

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { supabase } from '@/lib/supabase/client'

type ProfileState = {
  onboarding_completed: boolean | null
  photo_path: string | null
}

const STORAGE_BUCKET = 'festa-com-ia'

function isProfileComplete(profile: ProfileState | null) {
  return Boolean(profile?.onboarding_completed)
}

function buildPhotoUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  // cache-bust: garante que a imagem atualize logo após novo upload
  return data.publicUrl ? `${data.publicUrl}?t=${Date.now()}` : null
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
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
        .select('onboarding_completed,photo_path')
        .eq('auth_user_id', nextSession.user.id)
        .maybeSingle()

      if (!mounted) return

      const complete = isProfileComplete(profile)
      setPhotoUrl(buildPhotoUrl(profile?.photo_path))
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

    async function refreshPhoto() {
      const { data: sess } = await supabase.auth.getSession()
      const uid = sess.session?.user.id
      if (!uid || !mounted) return
      const { data: profile } = await supabase
        .from('festa-com-ia-professionals')
        .select('photo_path')
        .eq('auth_user_id', uid)
        .maybeSingle()
      if (!mounted) return
      setPhotoUrl(buildPhotoUrl(profile?.photo_path))
    }

    const handleProfileUpdated = () => { void refreshPhoto() }
    window.addEventListener('profile-photo-updated', handleProfileUpdated)

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
      window.removeEventListener('profile-photo-updated', handleProfileUpdated)
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
        <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} onSignOut={handleSignOut} photoUrl={photoUrl} />
        <main className="px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}

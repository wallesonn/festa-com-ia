"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, Menu } from 'lucide-react'
import { AppLogo } from '@/components/branding/AppLogo'
import { AvatarDefault } from '@/components/ui/AvatarDefault'

export function Header({
  onToggleSidebar,
  onSignOut,
  photoUrl,
}: {
  onToggleSidebar: () => void
  onSignOut: () => Promise<void>
  photoUrl?: string | null
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-card text-gray-100 border-b border-border">
      <div className="container-responsive h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="lg:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-800" onClick={onToggleSidebar} aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </button>
          <AppLogo
            variant="transparent"
            href="/"
            size={34}
            label="Festa com IA"
            className="rounded-xl px-1 py-0.5"
            labelClassName="hidden text-sm font-semibold tracking-wide sm:inline"
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="relative rounded-md p-2 hover:bg-gray-800" aria-label="Notificações">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-2 w-2 rounded-full bg-red-500" />
          </button>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="rounded-full ring-2 ring-transparent transition hover:ring-fuchsia-500/40 focus:outline-none focus:ring-fuchsia-500/40"
              aria-label="Abrir menu do perfil"
              aria-expanded={menuOpen}
            >
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt="Foto do perfil"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <AvatarDefault size={32} className="rounded-full" />
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 w-56 rounded-2xl border border-border bg-[#111827] p-2 shadow-2xl shadow-black/40">
                <Link
                  href="/perfil"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center rounded-xl px-3 py-2 text-sm text-gray-200 transition hover:bg-white/5"
                >
                  Meu perfil
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    setMenuOpen(false)
                    await onSignOut()
                  }}
                  className="mt-1 flex w-full items-center rounded-xl px-3 py-2 text-sm text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
                >
                  Sair da conta
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

"use client"

import { Bell, Menu } from 'lucide-react'

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border">
      <div className="container-responsive h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="lg:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100" onClick={onToggleSidebar} aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold">Festa com IA</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative rounded-md p-2 hover:bg-gray-100" aria-label="Notificações">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-2 w-2 rounded-full bg-red-500" />
          </button>
          <div className="h-8 w-8 rounded-full bg-gray-200" aria-label="Avatar" />
        </div>
      </div>
    </header>
  )
}

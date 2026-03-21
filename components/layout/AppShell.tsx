"use client"

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Mobile overlay */}
      <div className={`fixed inset-0 z-40 bg-black/40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`fixed z-50 top-0 left-0 h-full w-[var(--sidebar-width)] bg-white border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </aside>

      <div className="lg:pl-[var(--sidebar-width)] min-h-screen">
        <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="container-responsive py-6">
          {children}
        </main>
      </div>
    </div>
  )
}

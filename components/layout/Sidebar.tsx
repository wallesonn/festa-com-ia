"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, LayoutDashboard, ShoppingBag, Users, UserCircle2 } from 'lucide-react'

const items = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/painel', label: 'Painel', icon: LayoutGrid },
  { href: '/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/perfil', label: 'Perfil', icon: UserCircle2 },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="h-full flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-border font-semibold">Festa com IA</div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-800 ${active ? 'bg-gray-800 text-white font-medium' : 'text-gray-300'}`}>
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

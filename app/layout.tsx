import type { Metadata } from 'next'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'

export const metadata: Metadata = {
  title: 'Festa com IA',
  description: 'SaaS de gestão de pedidos e atendimento via WhatsApp para negócios de festas.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  )
}

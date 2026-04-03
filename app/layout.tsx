import type { Metadata } from 'next'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://festacomia.elizax.cloud'

export const metadata: Metadata = {
  title: 'Festa com IA',
  description: 'SaaS de gestão de pedidos e atendimento via WhatsApp para negócios de festas.',
  applicationName: 'Festa com IA',
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo_fundo_transparente.png', type: 'image/png' },
      { url: '/logo_fundo_branco.png', type: 'image/png', media: '(prefers-color-scheme: light)' },
    ],
    shortcut: '/favicon.svg',
    apple: '/logo_fundo_branco.png',
  },
  openGraph: {
    title: 'Festa com IA',
    description: 'SaaS de gestão de pedidos e atendimento via WhatsApp para negócios de festas.',
    images: [
      {
        url: '/logo_fundo_transparente.png',
        width: 250,
        height: 250,
        alt: 'Festa com IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Festa com IA',
    description: 'SaaS de gestão de pedidos e atendimento via WhatsApp para negócios de festas.',
    images: ['/logo_fundo_transparente.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  )
}

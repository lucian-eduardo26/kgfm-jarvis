import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jarvis KGFM',
  description: 'O que eu faco agora, e por que.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Jarvis', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  themeColor: '#0b0b0c',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh">{children}</body>
    </html>
  )
}

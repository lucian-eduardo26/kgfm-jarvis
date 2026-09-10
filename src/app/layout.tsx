import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jarvis KGFM',
  description: 'O que eu faco agora, e por que.',
  manifest: '/manifest.webmanifest',
  // O iPhone ignora o manifesto para o icone da tela inicial: ele quer
  // apple-touch-icon, PNG opaco e sem cantos arredondados - o iOS arredonda
  // sozinho. Por isso os dois caminhos aparecem aqui.
  icons: {
    icon: [
      { url: '/icone-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icone-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, title: 'Jarvis', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0b',
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

import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit'
})

export const metadata: Metadata = {
  title: 'Club Social OS - Sistema de Gestión para Clubes',
  description: 'Sistema operativo para la gestión integral de clubes sociales y deportivos. Control de socios, tesorería, disciplinas y reservas.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${outfit.variable} font-sans`}>
        {children}
      </body>
    </html>
  )
}

// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.palma@organico4you.com.br

import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import Navbar from '@/components/Navbar'
import MobileTabBar from '@/components/MobileTabBar'

export const metadata: Metadata = {
  title: 'Cogumelos.app',
  description: 'Sistema de cultivo de cogumelos',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cogumelos',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#534AB7',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cogumelos" />
        <meta name="theme-color" content="#534AB7" />
      </head>
      <body>
        <AuthProvider>
          {/* Navbar desktop — esconde no mobile */}
          <div className="hidden sm:block">
            <Navbar />
          </div>

          {/* Header mobile simples — só título da página */}
          <div
            className="sm:hidden"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 40,
              background: '#fff',
              borderBottom: '0.5px solid #EBEBEB',
              height: 52,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 800, color: '#FF3D00' }}>
              🍄 cogumelos
            </span>
            <span style={{ fontSize: 16, fontWeight: 400, color: '#bbb' }}>.app</span>
          </div>

          <main
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              padding: '0 0 80px', // padding bottom para não sobrepor tab bar no mobile
            }}
            className="sm:px-4 sm:py-6"
          >
            {children}
          </main>

          {/* Tab bar — só visível no mobile */}
          <MobileTabBar />
        </AuthProvider>
      </body>
    </html>
  )
}

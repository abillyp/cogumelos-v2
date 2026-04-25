// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.palma@organico4you.com.br

'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const tabs = [
  {
    href: '/',
    label: 'Início',
    color: '#534AB7',
    bgActive: '#EEEDFE',
    emoji: '🏠',
  },
  {
    href: '/experimentos',
    label: 'Lotes',
    color: '#00A550',
    bgActive: '#E3FFF0',
    emoji: '🌱',
  },
  {
    href: '/calculadora',
    label: 'Calcular',
    color: '#BA7517',
    bgActive: '#FAEEDA',
    emoji: '⚗️',
  },
  {
    href: '/relatorio',
    label: 'Relatório',
    color: '#1F6FEB',
    bgActive: '#E3F0FF',
    emoji: '📊',
  },
  {
    href: '/perfil',
    label: 'Perfil',
    color: '#FF3D00',
    bgActive: '#FFF0EC',
    emoji: '👤',
  },
]

export default function MobileTabBar() {
  const path     = usePathname()
  const { user } = useAuth()

  if (!user || path === '/login') return null

  return (
    <nav
      className="sm:hidden"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 68,
        background: '#fff',
        borderTop: '0.5px solid #EBEBEB',
        display: 'flex',
        zIndex: 40,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map((tab) => {
        const active = tab.href === '/'
          ? path === '/'
          : path.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              textDecoration: 'none',
              color: active ? tab.color : '#C0C0C0',
              transition: 'all .15s',
            }}
          >
            {/* Ícone com fundo colorido quando ativo */}
            <div style={{
              width: 36,
              height: 28,
              borderRadius: 8,
              background: active ? tab.bgActive : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              transition: 'all .15s',
            }}>
              {tab.emoji}
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              color: active ? tab.color : '#C0C0C0',
            }}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

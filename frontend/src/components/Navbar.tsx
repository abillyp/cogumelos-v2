// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.palma@organico4you.com.br

'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'

const links = [
  { href: '/experimentos', label: 'Experimentos' },
  { href: '/calculadora',  label: 'Calculadora'  },
  { href: '/insumos',      label: 'Insumos'       },
  { href: '/relatorio',    label: 'Relatório'     },
]

export default function Navbar() {
  const path                      = usePathname()
  const { user, logout, isAdmin } = useAuth()
  const [menu, setMenu]           = useState(false)

  if (path === '/login') return null

  return (
    <nav
      style={{
        background: '#fff',
        borderBottom: '1px solid #EBEBEB',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 16px',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {/* Logo */}
        <Link href="/experimentos" style={{ textDecoration: 'none', marginRight: 12 }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: '#FF3D00',
              letterSpacing: '-0.3px',
            }}
          >
            🍄 cogumelos
          </span>
          <span style={{ fontSize: 15, fontWeight: 400, color: '#bbb' }}>.app</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex gap-1">
          {links.map((l) => {
            const active = path.startsWith(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  padding: '6px 12px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all .15s',
                  background: active ? '#FFF0EC' : 'transparent',
                  color: active ? '#FF3D00' : '#555',
                }}
              >
                {l.label}
              </Link>
            )
          })}
          {isAdmin && (
            <Link
              href="/admin"
              style={{
                padding: '6px 12px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                background: path.startsWith('/admin') ? 'var(--amber-l)' : 'transparent',
                color: path.startsWith('/admin') ? 'var(--amber)' : '#555',
              }}
            >
              Admin
            </Link>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* User menu */}
        {user && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenu((m) => !m)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 10px', borderRadius: 10,
                border: '1.5px solid #EBEBEB', background: '#fff',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF3D00, #FF6B35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: '#fff',
                }}
              >
                {user.nome.charAt(0).toUpperCase()}
              </div>
              <span
                className="hidden sm:block"
                style={{ fontSize: 13, fontWeight: 600, color: '#333', maxWidth: 100 }}
              >
                {user.nome.split(' ')[0]}
              </span>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {menu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 30 }}
                  onClick={() => setMenu(false)}
                />
                <div
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                    background: '#fff', border: '1px solid #EBEBEB',
                    borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,.10)',
                    zIndex: 40, minWidth: 200, overflow: 'hidden',
                  }}
                >
                  {/* Header do menu */}
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #F0F0F0' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{user.nome}</p>
                    <p style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{user.email}</p>
                    <span
                      className={`badge mt-1 ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-prod'}`}
                    >
                      {user.role}
                    </span>
                  </div>

                  {/* Mobile nav links */}
                  <div className="sm:hidden" style={{ borderBottom: '1px solid #F0F0F0' }}>
                    {links.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setMenu(false)}
                        style={{
                          display: 'block', padding: '10px 14px',
                          fontSize: 13, fontWeight: 600, color: '#333',
                          textDecoration: 'none',
                        }}
                      >
                        {l.label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMenu(false)}
                        style={{
                          display: 'block', padding: '10px 14px',
                          fontSize: 13, fontWeight: 600,
                          color: 'var(--amber)', textDecoration: 'none',
                        }}
                      >
                        Admin
                      </Link>
                    )}
                  </div>

                  <button
                    onClick={logout}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 14px',
                      fontSize: 13, fontWeight: 600, color: 'var(--red)',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                    }}
                  >
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

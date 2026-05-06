// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'

const links = [
  { href: '/calculadora',  label: 'Calculadora' },
  { href: '/experimentos', label: 'Experimentos' },
  { href: '/insumos',      label: 'Insumos' },
  { href: '/relatorio',    label: 'Relatório' },
]

export default function Navbar() {
  const path            = usePathname()
  const { user, logout, isAdmin } = useAuth()
  const [menu, setMenu] = useState(false)

  if (path === '/login') return null

  return (
    <nav className="bg-white border-b border-gray-200 px-3 sm:px-4 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto flex items-center gap-1 h-13" style={{height:52}}>
        <span className="font-semibold text-sm mr-2 sm:mr-4 shrink-0" style={{ color: 'var(--purple)' }}>
          cogumelos<span className="font-normal text-gray-400">.app</span>
        </span>

        {/* Desktop nav */}
        <div className="hidden sm:flex gap-1">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                path.startsWith(l.href) ? 'font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
              style={path.startsWith(l.href) ? { background:'var(--purple-l)', color:'var(--purple)' } : {}}>
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin/tenants"
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                path.startsWith('/admin') ? 'font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
              style={path.startsWith('/admin') ? { background:'var(--amber-l)', color:'var(--amber)' } : {}}>
              Admin
            </Link>
          )}
        </div>

        <div className="flex-1" />

        {/* User menu */}
        {user && (
          <div className="relative">
            <button onClick={() => setMenu(m => !m)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0"
                style={{ background: 'var(--purple)' }}>
                {user?.nome?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <span className="hidden sm:block text-sm text-gray-700 max-w-[120px] truncate">{user.nome}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-400">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {menu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-40 min-w-[180px] py-1">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.nome}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    <span className="badge mt-1 text-xs" style={user.role === 'ADMIN'
                      ? {background:'var(--amber-l)', color:'var(--amber)'}
                      : {background:'var(--purple-l)', color:'var(--purple)'}}>
                      {user.role}
                    </span>
                  </div>
                  {/* Mobile nav links */}
                  <div className="sm:hidden border-b border-gray-100 py-1">
                    {links.map(l => (
                      <Link key={l.href} href={l.href} onClick={() => setMenu(false)}
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        {l.label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link href="/admin/tenants" onClick={() => setMenu(false)}
                        className="block px-3 py-2 text-sm hover:bg-gray-50"
                        style={{ color: 'var(--amber)' }}>
                        Admin
                      </Link>
                    )}
                  </div>
                  <button onClick={logout}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                    style={{ color: 'var(--red)' }}>
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

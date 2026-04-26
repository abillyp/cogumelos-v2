// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import { useState, useEffect, createContext, useContext } from 'react'
import { AuthUser } from '@/lib/types'
import { saveTokens, clearTokens } from '@/lib/api'

interface AuthCtx {
  user: AuthUser | null
  loading: boolean
  login: (token: string, refreshToken: string, user: AuthUser) => void
  logout: () => Promise<void>
  isAdmin: boolean
}

const Ctx = createContext<AuthCtx>({
  user: null, loading: true,
  login: () => {}, logout: async () => {}, isAdmin: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { clearTokens() }
    }
    setLoading(false)
  }, [])

  function login(token: string, refreshToken: string, u: AuthUser) {
    saveTokens(token, refreshToken)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  async function logout() {
    const rt = localStorage.getItem('refreshToken')
    if (rt) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      }).catch(() => {})
    }
    clearTokens()
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <Ctx.Provider value={{ user, loading, login, logout, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() { return useContext(Ctx) }

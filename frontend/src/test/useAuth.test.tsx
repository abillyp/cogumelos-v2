// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/hooks/useAuth'

// Componente auxiliar que expõe os valores do contexto
function ContextoConsumer() {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <div data-testid="loading">loading</div>
  return (
    <div>
      <span data-testid="user">{user ? user.nome : 'null'}</span>
      <span data-testid="email">{user?.email ?? ''}</span>
      <span data-testid="role">{user?.role ?? ''}</span>
      <span data-testid="isAdmin">{String(isAdmin)}</span>
    </div>
  )
}

const USER_TENANT = { id: '1', nome: 'Billy', email: 'billy@test.com', role: 'ADMIN_TENANT' as const, loginType: 'EMAIL' as const }
const USER_ADMIN  = { id: '2', nome: 'Admin', email: 'admin@test.com', role: 'ADMIN' as const, loginType: 'EMAIL' as const }
const USER_PRODUTOR = { id: '3', nome: 'Prod', email: 'prod@test.com', role: 'PRODUTOR' as const, loginType: 'EMAIL' as const }

// ─── AuthProvider — inicialização ─────────────────────────────────────────────
describe('AuthProvider — inicialização', () => {
  beforeEach(() => localStorage.clear())

  it('inicia com user null quando localStorage está vazio', async () => {
    render(<AuthProvider><ContextoConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument())
    expect(screen.getByTestId('user').textContent).toBe('null')
    expect(screen.getByTestId('isAdmin').textContent).toBe('false')
  })

  it('restaura usuário salvo no localStorage', async () => {
    localStorage.setItem('user', JSON.stringify(USER_TENANT))
    render(<AuthProvider><ContextoConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Billy'))
    expect(screen.getByTestId('email').textContent).toBe('billy@test.com')
    expect(screen.getByTestId('role').textContent).toBe('ADMIN_TENANT')
  })

  it('limpa localStorage e define user=null quando JSON é inválido', async () => {
    localStorage.setItem('user', 'INVALID_JSON{{{')
    render(<AuthProvider><ContextoConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument())
    expect(screen.getByTestId('user').textContent).toBe('null')
    expect(localStorage.getItem('user')).toBeNull()
  })
})

// ─── AuthProvider — isAdmin ───────────────────────────────────────────────────
describe('AuthProvider — isAdmin', () => {
  beforeEach(() => localStorage.clear())

  it('isAdmin=true para role ADMIN', async () => {
    localStorage.setItem('user', JSON.stringify(USER_ADMIN))
    render(<AuthProvider><ContextoConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('isAdmin').textContent).toBe('true'))
  })

  it('isAdmin=false para role ADMIN_TENANT', async () => {
    localStorage.setItem('user', JSON.stringify(USER_TENANT))
    render(<AuthProvider><ContextoConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('isAdmin').textContent).toBe('false'))
  })

  it('isAdmin=false para role PRODUTOR', async () => {
    localStorage.setItem('user', JSON.stringify(USER_PRODUTOR))
    render(<AuthProvider><ContextoConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('isAdmin').textContent).toBe('false'))
  })
})

// ─── AuthProvider — login() ───────────────────────────────────────────────────
describe('AuthProvider — login()', () => {
  beforeEach(() => localStorage.clear())

  it('salva user no localStorage e atualiza contexto', async () => {
    function LoginBtn() {
      const { login, user } = useAuth()
      return (
        <>
          <span data-testid="user">{user?.nome ?? 'null'}</span>
          <button onClick={() => login('', USER_TENANT)}>entrar</button>
        </>
      )
    }
    render(<AuthProvider><LoginBtn /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('null'))

    await act(async () => { screen.getByRole('button').click() })

    expect(screen.getByTestId('user').textContent).toBe('Billy')
    expect(JSON.parse(localStorage.getItem('user')!)).toMatchObject({ nome: 'Billy' })
  })

  it('não persiste token no localStorage — apenas dados de UI', async () => {
    function LoginBtn() {
      const { login } = useAuth()
      return <button onClick={() => login('token-secreto', USER_TENANT)}>entrar</button>
    }
    render(<AuthProvider><LoginBtn /></AuthProvider>)
    await act(async () => { screen.getByRole('button').click() })

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    const user = JSON.parse(localStorage.getItem('user')!)
    expect(user.token).toBeUndefined()
  })
})

// ─── AuthProvider — logout() ─────────────────────────────────────────────────
describe('AuthProvider — logout()', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  })

  it('chama /api/auth/logout com credentials:include', async () => {
    localStorage.setItem('user', JSON.stringify(USER_TENANT))
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', mockFetch)

    function LogoutBtn() {
      const { logout } = useAuth()
      return <button onClick={() => logout()}>sair</button>
    }
    render(<AuthProvider><LogoutBtn /></AuthProvider>)
    await act(async () => { screen.getByRole('button').click() })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    )
  })

  it('remove user do localStorage após logout', async () => {
    localStorage.setItem('user', JSON.stringify(USER_TENANT))

    function LogoutBtn() {
      const { logout } = useAuth()
      return <button onClick={() => logout()}>sair</button>
    }
    render(<AuthProvider><LogoutBtn /></AuthProvider>)
    await act(async () => { screen.getByRole('button').click() })

    await waitFor(() => expect(localStorage.getItem('user')).toBeNull())
  })

  it('limpa user mesmo que a chamada ao backend falhe', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    localStorage.setItem('user', JSON.stringify(USER_TENANT))

    function LogoutBtn() {
      const { logout } = useAuth()
      return <button onClick={() => logout()}>sair</button>
    }
    render(<AuthProvider><LogoutBtn /></AuthProvider>)
    await act(async () => { screen.getByRole('button').click() })

    await waitFor(() => expect(localStorage.getItem('user')).toBeNull())
  })
})

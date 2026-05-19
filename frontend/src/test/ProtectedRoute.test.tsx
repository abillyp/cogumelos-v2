// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ProtectedRoute from '@/components/ProtectedRoute'

const mockPush   = vi.fn()
const mockUseAuth = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter:       () => ({ push: mockPush }),
  usePathname:     () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Estado de carregamento ───────────────────────────────────────────────
  it('exibe "Carregando..." enquanto loading=true', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, isAdmin: false })
    render(<ProtectedRoute><span>conteúdo</span></ProtectedRoute>)
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
    expect(screen.queryByText('conteúdo')).not.toBeInTheDocument()
  })

  it('não redireciona enquanto loading=true', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, isAdmin: false })
    render(<ProtectedRoute><span>conteúdo</span></ProtectedRoute>)
    // aguarda um tick para garantir que nenhum efeito disparou
    await new Promise(r => setTimeout(r, 50))
    expect(mockPush).not.toHaveBeenCalled()
  })

  // ─── Usuário não autenticado ──────────────────────────────────────────────
  it('redireciona para /login quando usuário não está autenticado', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, isAdmin: false })
    render(<ProtectedRoute><span>conteúdo</span></ProtectedRoute>)
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'))
  })

  it('não renderiza children quando usuário é null', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, isAdmin: false })
    render(<ProtectedRoute><span>conteúdo secreto</span></ProtectedRoute>)
    expect(screen.queryByText('conteúdo secreto')).not.toBeInTheDocument()
  })

  // ─── Usuário autenticado ──────────────────────────────────────────────────
  it('renderiza children quando usuário está autenticado', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', nome: 'Billy', role: 'ADMIN_TENANT' },
      loading: false,
      isAdmin: false,
    })
    render(<ProtectedRoute><span>conteúdo protegido</span></ProtectedRoute>)
    expect(screen.getByText('conteúdo protegido')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  // ─── adminOnly — usuário sem permissão ───────────────────────────────────
  it('redireciona ADMIN_TENANT para /calculadora quando adminOnly=true', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', nome: 'Billy', role: 'ADMIN_TENANT' },
      loading: false,
      isAdmin: false,
    })
    render(<ProtectedRoute adminOnly><span>painel admin</span></ProtectedRoute>)
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/calculadora'))
  })

  it('não renderiza children para não-admin quando adminOnly=true', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', nome: 'Billy', role: 'ADMIN_TENANT' },
      loading: false,
      isAdmin: false,
    })
    render(<ProtectedRoute adminOnly><span>painel admin</span></ProtectedRoute>)
    expect(screen.queryByText('painel admin')).not.toBeInTheDocument()
  })

  // ─── adminOnly — ADMIN ───────────────────────────────────────────────────
  it('renderiza children para ADMIN quando adminOnly=true', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '2', nome: 'Admin', role: 'ADMIN' },
      loading: false,
      isAdmin: true,
    })
    render(<ProtectedRoute adminOnly><span>painel admin</span></ProtectedRoute>)
    expect(screen.getByText('painel admin')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  // ─── adminOnly=false (padrão) com usuário comum ──────────────────────────
  it('renderiza children para PRODUTOR quando adminOnly não está ativo', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '3', nome: 'Prod', role: 'PRODUTOR' },
      loading: false,
      isAdmin: false,
    })
    render(<ProtectedRoute><span>área comum</span></ProtectedRoute>)
    expect(screen.getByText('área comum')).toBeInTheDocument()
  })
})

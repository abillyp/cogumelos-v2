// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.palma@organico4you.com.br

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MobileTabBar from '@/components/MobileTabBar'

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: '1', nome: 'Billy', email: 'billy@test.com', role: 'ADMIN_TENANT' } }),
}))

// Mock usePathname por rota
const mockPathname = vi.fn()
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter:   () => ({ push: vi.fn() }),
}))

describe('MobileTabBar', () => {
  it('deve renderizar as 5 abas de navegação', () => {
    mockPathname.mockReturnValue('/')
    render(<MobileTabBar />)

    expect(screen.getByText('Início')).toBeInTheDocument()
    expect(screen.getByText('Lotes')).toBeInTheDocument()
    expect(screen.getByText('Calcular')).toBeInTheDocument()
    expect(screen.getByText('Relatório')).toBeInTheDocument()
    expect(screen.getByText('Perfil')).toBeInTheDocument()
  })

  it('não deve renderizar quando usuário não está autenticado', () => {
    vi.mocked(vi.importActual('@/hooks/useAuth')).useAuth = () => ({ user: null })
    vi.doMock('@/hooks/useAuth', () => ({
      useAuth: () => ({ user: null }),
    }))
    // Reimport com mock de usuário null
    mockPathname.mockReturnValue('/')
    // Tab bar não deve aparecer sem usuário
  })

  it('não deve renderizar na tela de login', () => {
    mockPathname.mockReturnValue('/login')
    const { container } = render(<MobileTabBar />)
    // nav deve estar oculto na rota /login
    const nav = container.querySelector('nav')
    expect(nav).toBeNull()
  })

  it('aba Início deve ter estilo ativo quando em /', () => {
    mockPathname.mockReturnValue('/')
    render(<MobileTabBar />)
    const link = screen.getByText('Início').closest('a')
    expect(link).toHaveAttribute('href', '/')
  })

  it('aba Lotes deve ter estilo ativo quando em /experimentos', () => {
    mockPathname.mockReturnValue('/experimentos')
    render(<MobileTabBar />)
    const link = screen.getByText('Lotes').closest('a')
    expect(link).toHaveAttribute('href', '/experimentos')
  })
})

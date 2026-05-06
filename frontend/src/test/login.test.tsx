// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/login/page'

const mockPush  = vi.fn()
const mockLogin = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, login: mockLogin }),
}))

vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      login:    vi.fn(),
      registro: vi.fn(),
    },
  },
  saveTokens: vi.fn(),
}))

import { api } from '@/lib/api'

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar o botão de login com Google', () => {
    render(<LoginPage />)
    expect(screen.getByText('Entrar com Google')).toBeInTheDocument()
  })

  it('deve renderizar campos de email e senha', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('deve alternar para aba de registro ao clicar em Criar conta', async () => {
    render(<LoginPage />)
    const abas = screen.getAllByText('Criar conta')
    await userEvent.click(abas[0])
    expect(screen.getByPlaceholderText('Seu nome completo')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ex: Cogumelos São Paulo')).toBeInTheDocument()
  })

  it('deve chamar api.auth.login com credenciais corretas', async () => {
    // ✅ refreshToken removido do retorno — agora vem via HttpOnly cookie
    vi.mocked(api.auth.login).mockResolvedValue({
      token: 'token-123',
      id: 'user-1', nome: 'Billy', email: 'billy@test.com', role: 'ADMIN_TENANT',
    } as any)

    render(<LoginPage />)

    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'billy@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'senha123')
    await userEvent.click(screen.getAllByRole('button').find(b => b.getAttribute('type') === 'submit')!)

    await waitFor(() => {
      expect(api.auth.login).toHaveBeenCalledWith({
        email: 'billy@test.com',
        senha: 'senha123',
      })
    })
  })

  it('deve chamar login() do contexto após autenticação bem-sucedida', async () => {
    // ✅ refreshToken removido do retorno — agora vem via HttpOnly cookie
    const userData = {
      token: 'token-123',
      id: 'user-1', nome: 'Billy', email: 'billy@test.com', role: 'ADMIN_TENANT',
    }
    vi.mocked(api.auth.login).mockResolvedValue(userData as any)

    render(<LoginPage />)
    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'billy@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'senha123')
    await userEvent.click(screen.getAllByRole('button').find(b => b.getAttribute('type') === 'submit')!)

    await waitFor(() => {
      // ✅ assinatura nova: login(token, user) — sem refreshToken
      expect(mockLogin).toHaveBeenCalledWith(
        'token-123',
        expect.objectContaining({ email: 'billy@test.com' })
      )
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('deve exibir mensagem de erro quando login falha', async () => {
    vi.mocked(api.auth.login).mockRejectedValue(new Error('Email ou senha inválidos'))

    render(<LoginPage />)
    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'wrong@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'errado')
    await userEvent.click(screen.getAllByRole('button').find(b => b.getAttribute('type') === 'submit')!)

    await waitFor(() => {
      expect(screen.getByText('Email ou senha inválidos')).toBeInTheDocument()
    })
  })

  it('não deve exibir credenciais de admin hardcoded', () => {
    render(<LoginPage />)
    expect(screen.queryByText(/admin@cogumelos/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/admin123/i)).not.toBeInTheDocument()
  })

  it('deve registrar novo usuário com todos os campos', async () => {
    // ✅ refreshToken removido do retorno — agora vem via HttpOnly cookie
    vi.mocked(api.auth.registro).mockResolvedValue({
      token: 'token-novo',
      id: 'user-novo', nome: 'Novo', email: 'novo@test.com', role: 'ADMIN_TENANT',
    } as any)

    render(<LoginPage />)

    const abas = screen.getAllByText('Criar conta')
    await userEvent.click(abas[0])

    await userEvent.type(screen.getByPlaceholderText('Seu nome completo'), 'Novo Usuário')
    await userEvent.type(screen.getByPlaceholderText('Ex: Cogumelos São Paulo'), 'Empresa X')
    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'novo@test.com')
    await userEvent.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'senha123')

    const botoes = screen.getAllByText('Criar conta')
    await userEvent.click(botoes[botoes.length - 1])

    await waitFor(() => {
      expect(api.auth.registro).toHaveBeenCalledWith({
        nome:         'Novo Usuário',
        nomeProdutor: 'Empresa X',
        email:        'novo@test.com',
        senha:        'senha123',
      })
    })
  })
})

// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RedefinirSenhaPage from '@/app/redefinir-senha/page'

const mockPush = vi.fn()
const mockGetParam = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter:       () => ({ push: mockPush }),
  usePathname:     () => '/redefinir-senha',
  useSearchParams: () => ({ get: mockGetParam }),
}))

vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      redefinirSenha: vi.fn(),
    },
  },
  toErrorMessage: (e: unknown, fallback = 'Erro desconhecido') =>
    e instanceof Error ? e.message : fallback,
}))

import { api } from '@/lib/api'

describe('RedefinirSenhaPage — sem token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetParam.mockReturnValue(null)
  })

  it('exibe mensagem de link inválido quando não há token na URL', () => {
    render(<RedefinirSenhaPage />)
    expect(screen.getByText(/link inválido/i)).toBeInTheDocument()
  })

  it('exibe botão para solicitar novo link quando token ausente', () => {
    render(<RedefinirSenhaPage />)
    expect(screen.getByRole('button', { name: /solicitar novo link/i })).toBeInTheDocument()
  })

  it('navega para /esqueci-minha-senha ao clicar em solicitar novo link', async () => {
    render(<RedefinirSenhaPage />)
    await userEvent.click(screen.getByRole('button', { name: /solicitar novo link/i }))
    expect(mockPush).toHaveBeenCalledWith('/esqueci-minha-senha')
  })
})

describe('RedefinirSenhaPage — com token válido', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetParam.mockReturnValue('token-valido-123')
  })

  it('renderiza campos de nova senha e confirmação', () => {
    render(<RedefinirSenhaPage />)
    expect(screen.getByPlaceholderText('Mínimo 8 caracteres')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Repita a nova senha')).toBeInTheDocument()
  })

  it('botão fica desabilitado com campos vazios', () => {
    render(<RedefinirSenhaPage />)
    expect(screen.getByRole('button', { name: /redefinir senha/i })).toBeDisabled()
  })

  it('exibe erro quando as senhas não coincidem', async () => {
    render(<RedefinirSenhaPage />)
    await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'senha123')
    await userEvent.type(screen.getByPlaceholderText('Repita a nova senha'), 'outraSenha')
    await userEvent.click(screen.getByRole('button', { name: /redefinir senha/i }))

    await waitFor(() => {
      expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument()
    })
    expect(api.auth.redefinirSenha).not.toHaveBeenCalled()
  })

  it('exibe erro quando senha tem menos de 8 caracteres', async () => {
    render(<RedefinirSenhaPage />)
    await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), '123')
    await userEvent.type(screen.getByPlaceholderText('Repita a nova senha'), '123')
    await userEvent.click(screen.getByRole('button', { name: /redefinir senha/i }))

    await waitFor(() => {
      expect(screen.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeInTheDocument()
    })
    expect(api.auth.redefinirSenha).not.toHaveBeenCalled()
  })

  it('chama api.auth.redefinirSenha com token e nova senha', async () => {
    vi.mocked(api.auth.redefinirSenha).mockResolvedValue(undefined as any)
    render(<RedefinirSenhaPage />)

    await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'novaSenha123')
    await userEvent.type(screen.getByPlaceholderText('Repita a nova senha'), 'novaSenha123')
    await userEvent.click(screen.getByRole('button', { name: /redefinir senha/i }))

    await waitFor(() => {
      expect(api.auth.redefinirSenha).toHaveBeenCalledWith('token-valido-123', 'novaSenha123')
    })
  })

  it('exibe tela de sucesso após redefinição bem-sucedida', async () => {
    vi.mocked(api.auth.redefinirSenha).mockResolvedValue(undefined as any)
    render(<RedefinirSenhaPage />)

    await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'novaSenha123')
    await userEvent.type(screen.getByPlaceholderText('Repita a nova senha'), 'novaSenha123')
    await userEvent.click(screen.getByRole('button', { name: /redefinir senha/i }))

    await waitFor(() => {
      expect(screen.getByText('Senha redefinida!')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /ir para o login/i })).toBeInTheDocument()
  })

  it('exibe erro retornado pela API', async () => {
    vi.mocked(api.auth.redefinirSenha).mockRejectedValue(new Error('Token expirado'))
    render(<RedefinirSenhaPage />)

    await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'novaSenha123')
    await userEvent.type(screen.getByPlaceholderText('Repita a nova senha'), 'novaSenha123')
    await userEvent.click(screen.getByRole('button', { name: /redefinir senha/i }))

    await waitFor(() => {
      expect(screen.getByText('Token expirado')).toBeInTheDocument()
    })
  })

  it('navega para /login ao clicar em "Ir para o login" após sucesso', async () => {
    vi.mocked(api.auth.redefinirSenha).mockResolvedValue(undefined as any)
    render(<RedefinirSenhaPage />)

    await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'novaSenha123')
    await userEvent.type(screen.getByPlaceholderText('Repita a nova senha'), 'novaSenha123')
    await userEvent.click(screen.getByRole('button', { name: /redefinir senha/i }))
    await waitFor(() => screen.getByText('Senha redefinida!'))

    await userEvent.click(screen.getByRole('button', { name: /ir para o login/i }))
    expect(mockPush).toHaveBeenCalledWith('/login')
  })
})

// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EsqueciSenhaPage from '@/app/esqueci-minha-senha/page'

const mockBack = vi.fn()
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter:       () => ({ push: mockPush, back: mockBack }),
  usePathname:     () => '/esqueci-minha-senha',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      esqueciSenha: vi.fn(),
    },
  },
}))

import { api } from '@/lib/api'

describe('EsqueciSenhaPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renderiza campo de email e botão de envio', () => {
    render(<EsqueciSenhaPage />)
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar link/i })).toBeInTheDocument()
  })

  it('botão fica desabilitado quando email está vazio', () => {
    render(<EsqueciSenhaPage />)
    const btn = screen.getByRole('button', { name: /enviar link/i })
    expect(btn).toBeDisabled()
  })

  it('botão fica habilitado após digitar email', async () => {
    render(<EsqueciSenhaPage />)
    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'teste@email.com')
    const btn = screen.getByRole('button', { name: /enviar link/i })
    expect(btn).not.toBeDisabled()
  })

  it('chama api.auth.esqueciSenha com o email informado', async () => {
    vi.mocked(api.auth.esqueciSenha).mockResolvedValue(undefined as any)
    render(<EsqueciSenhaPage />)

    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'user@test.com')
    await userEvent.click(screen.getByRole('button', { name: /enviar link/i }))

    await waitFor(() => {
      expect(api.auth.esqueciSenha).toHaveBeenCalledWith('user@test.com')
    })
  })

  it('exibe tela de sucesso após envio bem-sucedido', async () => {
    vi.mocked(api.auth.esqueciSenha).mockResolvedValue(undefined as any)
    render(<EsqueciSenhaPage />)

    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'user@test.com')
    await userEvent.click(screen.getByRole('button', { name: /enviar link/i }))

    await waitFor(() => {
      expect(screen.getByText('Email enviado!')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /voltar para o login/i })).toBeInTheDocument()
  })

  it('exibe mensagem de erro quando API falha', async () => {
    vi.mocked(api.auth.esqueciSenha).mockRejectedValue(new Error('Erro de rede'))
    render(<EsqueciSenhaPage />)

    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'user@test.com')
    await userEvent.click(screen.getByRole('button', { name: /enviar link/i }))

    await waitFor(() => {
      expect(screen.getByText('Erro ao enviar. Tente novamente.')).toBeInTheDocument()
    })
  })

  it('não exibe a tela de sucesso quando ocorre erro', async () => {
    vi.mocked(api.auth.esqueciSenha).mockRejectedValue(new Error('falha'))
    render(<EsqueciSenhaPage />)

    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'user@test.com')
    await userEvent.click(screen.getByRole('button', { name: /enviar link/i }))

    await waitFor(() => expect(screen.queryByText('Email enviado!')).not.toBeInTheDocument())
  })

  it('botão voltar chama router.back()', async () => {
    render(<EsqueciSenhaPage />)
    await userEvent.click(screen.getByRole('button', { name: /← voltar/i }))
    expect(mockBack).toHaveBeenCalled()
  })

  it('botão "Voltar para o login" navega para /login após sucesso', async () => {
    vi.mocked(api.auth.esqueciSenha).mockResolvedValue(undefined as any)
    render(<EsqueciSenhaPage />)

    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'user@test.com')
    await userEvent.click(screen.getByRole('button', { name: /enviar link/i }))
    await waitFor(() => screen.getByText('Email enviado!'))

    await userEvent.click(screen.getByRole('button', { name: /voltar para o login/i }))
    expect(mockPush).toHaveBeenCalledWith('/login')
  })
})

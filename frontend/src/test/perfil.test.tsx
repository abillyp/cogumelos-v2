// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PerfilPage from '@/app/perfil/page'

const mockPush   = vi.fn()
const mockLogout = vi.fn()
const mockLogin  = vi.fn()
const mockUseAuth = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter:       () => ({ push: mockPush }),
  usePathname:     () => '/perfil',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      alterarSenha:    vi.fn(),
      atualizarPerfil: vi.fn(),
      meusDados:       vi.fn(),
      encerrarConta:   vi.fn(),
    },
  },
  toErrorMessage: (e: unknown, fallback = 'Erro desconhecido') =>
    e instanceof Error ? e.message : fallback,
}))

import { api } from '@/lib/api'

const USER_EMAIL = {
  id: '1', nome: 'Billy Palma', email: 'billy@test.com',
  role: 'ADMIN_TENANT' as const, loginType: 'EMAIL' as const,
}

const USER_GOOGLE = {
  id: '2', nome: 'Google User', email: 'google@test.com',
  role: 'PRODUTOR' as const, loginType: 'GOOGLE' as const,
}

// ─── Renderização ─────────────────────────────────────────────────────────────
describe('PerfilPage — renderização', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: USER_EMAIL, loading: false, isAdmin: false,
      login: mockLogin, logout: mockLogout,
    })
  })

  it('exibe nome, email e role do usuário', () => {
    render(<PerfilPage />)
    // Nome e email aparecem em mais de um elemento — verificamos pelo heading e pelo count
    expect(screen.getByRole('heading', { name: 'Billy Palma' })).toBeInTheDocument()
    expect(screen.getAllByText('billy@test.com').length).toBeGreaterThan(0)
    expect(screen.getAllByText('ADMIN_TENANT').length).toBeGreaterThan(0)
  })

  it('exibe inicial do nome no avatar', () => {
    render(<PerfilPage />)
    // Avatar com inicial B (Billy)
    const avatar = screen.getAllByText('B')
    expect(avatar.length).toBeGreaterThan(0)
  })

  it('exibe seção "Alterar senha" para usuários com login por email', () => {
    render(<PerfilPage />)
    expect(screen.getByText(/alterar senha/i)).toBeInTheDocument()
  })

  it('não exibe seção "Alterar senha" para usuários Google (OAuth2)', () => {
    mockUseAuth.mockReturnValue({
      user: USER_GOOGLE, loading: false, isAdmin: false,
      login: mockLogin, logout: mockLogout,
    })
    render(<PerfilPage />)
    expect(screen.queryByText(/alterar senha/i)).not.toBeInTheDocument()
  })

  it('exibe link para Admin no menu de navegação quando isAdmin=true', () => {
    mockUseAuth.mockReturnValue({
      user: { ...USER_EMAIL, role: 'ADMIN' as const }, loading: false, isAdmin: true,
      login: mockLogin, logout: mockLogout,
    })
    render(<PerfilPage />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('não exibe link Admin para usuários não-admin', () => {
    render(<PerfilPage />)
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })
})

// ─── AlterarSenha ─────────────────────────────────────────────────────────────
describe('PerfilPage — AlterarSenha', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: USER_EMAIL, loading: false, isAdmin: false,
      login: mockLogin, logout: mockLogout,
    })
  })

  // As labels não têm htmlFor, então usamos querySelectorAll para os inputs de senha
  function getSenhaInputs(container: HTMLElement) {
    return container.querySelectorAll('input[type="password"]')
  }

  async function abrirFormulario(container: HTMLElement) {
    await userEvent.click(screen.getByRole('button', { name: /alterar senha/i }))
    // aguarda os inputs aparecerem
    await waitFor(() => expect(getSenhaInputs(container).length).toBe(3))
  }

  it('exibe os 3 campos de senha após clicar em "Alterar senha"', async () => {
    const { container } = render(<PerfilPage />)
    await abrirFormulario(container)
    expect(getSenhaInputs(container).length).toBe(3)
    expect(screen.getByText('Senha atual')).toBeInTheDocument()
    expect(screen.getByText('Nova senha')).toBeInTheDocument()
    expect(screen.getByText('Confirmar nova senha')).toBeInTheDocument()
  })

  it('exibe erro quando senhas não coincidem', async () => {
    const { container } = render(<PerfilPage />)
    await abrirFormulario(container)
    const [inputAtual, inputNova, inputConfirmar] = getSenhaInputs(container)
    await userEvent.type(inputAtual, 'senhaAtual')
    await userEvent.type(inputNova, 'novaSenha1')
    await userEvent.type(inputConfirmar, 'novaSenha2')
    await userEvent.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    await waitFor(() => {
      expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument()
    })
    expect(api.auth.alterarSenha).not.toHaveBeenCalled()
  })

  it('exibe erro quando nova senha tem menos de 8 caracteres', async () => {
    const { container } = render(<PerfilPage />)
    await abrirFormulario(container)
    const [inputAtual, inputNova, inputConfirmar] = getSenhaInputs(container)
    await userEvent.type(inputAtual, 'senhaAtual')
    await userEvent.type(inputNova, '123')
    await userEvent.type(inputConfirmar, '123')
    await userEvent.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    await waitFor(() => {
      expect(screen.getByText('Mínimo 8 caracteres.')).toBeInTheDocument()
    })
    expect(api.auth.alterarSenha).not.toHaveBeenCalled()
  })

  it('chama api.auth.alterarSenha com senhas corretas', async () => {
    vi.mocked(api.auth.alterarSenha).mockResolvedValue(undefined as any)
    const { container } = render(<PerfilPage />)
    await abrirFormulario(container)
    const [inputAtual, inputNova, inputConfirmar] = getSenhaInputs(container)
    await userEvent.type(inputAtual, 'senhaAtual123')
    await userEvent.type(inputNova, 'novaSenha123')
    await userEvent.type(inputConfirmar, 'novaSenha123')
    await userEvent.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    await waitFor(() => {
      expect(api.auth.alterarSenha).toHaveBeenCalledWith('senhaAtual123', 'novaSenha123')
    })
  })

  it('exibe mensagem de sucesso após alterar senha', async () => {
    vi.mocked(api.auth.alterarSenha).mockResolvedValue(undefined as any)
    const { container } = render(<PerfilPage />)
    await abrirFormulario(container)
    const [inputAtual, inputNova, inputConfirmar] = getSenhaInputs(container)
    await userEvent.type(inputAtual, 'senhaAtual123')
    await userEvent.type(inputNova, 'novaSenha123')
    await userEvent.type(inputConfirmar, 'novaSenha123')
    await userEvent.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    await waitFor(() => {
      expect(screen.getByText(/senha alterada com sucesso/i)).toBeInTheDocument()
    })
  })

  it('exibe erro da API quando alteração falha', async () => {
    vi.mocked(api.auth.alterarSenha).mockRejectedValue(new Error('Senha atual incorreta'))
    const { container } = render(<PerfilPage />)
    await abrirFormulario(container)
    const [inputAtual, inputNova, inputConfirmar] = getSenhaInputs(container)
    await userEvent.type(inputAtual, 'senhaErrada')
    await userEvent.type(inputNova, 'novaSenha123')
    await userEvent.type(inputConfirmar, 'novaSenha123')
    await userEvent.click(screen.getByRole('button', { name: /salvar nova senha/i }))

    await waitFor(() => {
      expect(screen.getByText('Senha atual incorreta')).toBeInTheDocument()
    })
  })
})

// ─── Encerrar conta ───────────────────────────────────────────────────────────
describe('PerfilPage — encerrar conta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: USER_EMAIL, loading: false, isAdmin: false,
      login: mockLogin, logout: mockLogout,
    })
  })

  it('exibe tela de confirmação ao clicar em "Encerrar conta"', async () => {
    render(<PerfilPage />)
    await userEvent.click(screen.getByText(/encerrar conta e apagar dados/i))
    expect(screen.getByText(/irreversível/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirmar encerramento/i })).toBeInTheDocument()
  })

  it('cancela encerramento ao clicar em Cancelar', async () => {
    render(<PerfilPage />)
    await userEvent.click(screen.getByText(/encerrar conta e apagar dados/i))
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(screen.queryByText(/irreversível/i)).not.toBeInTheDocument()
  })

  it('chama api.auth.encerrarConta ao confirmar', async () => {
    vi.mocked(api.auth.encerrarConta).mockResolvedValue(undefined as any)
    render(<PerfilPage />)
    await userEvent.click(screen.getByText(/encerrar conta e apagar dados/i))
    await userEvent.click(screen.getByRole('button', { name: /confirmar encerramento/i }))

    await waitFor(() => {
      expect(api.auth.encerrarConta).toHaveBeenCalled()
    })
  })

  it('chama logout após encerrar conta com sucesso', async () => {
    vi.mocked(api.auth.encerrarConta).mockResolvedValue(undefined as any)
    render(<PerfilPage />)
    await userEvent.click(screen.getByText(/encerrar conta e apagar dados/i))
    await userEvent.click(screen.getByRole('button', { name: /confirmar encerramento/i }))

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
    })
  })

  it('exibe erro quando encerramento falha', async () => {
    vi.mocked(api.auth.encerrarConta).mockRejectedValue(new Error('Erro ao encerrar conta.'))
    render(<PerfilPage />)
    await userEvent.click(screen.getByText(/encerrar conta e apagar dados/i))
    await userEvent.click(screen.getByRole('button', { name: /confirmar encerramento/i }))

    await waitFor(() => {
      expect(screen.getByText('Erro ao encerrar conta.')).toBeInTheDocument()
    })
    expect(mockLogout).not.toHaveBeenCalled()
  })
})

// ─── Logout ───────────────────────────────────────────────────────────────────
describe('PerfilPage — logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: USER_EMAIL, loading: false, isAdmin: false,
      login: mockLogin, logout: mockLogout,
    })
  })

  it('chama logout ao clicar em "Sair da conta"', async () => {
    render(<PerfilPage />)
    await userEvent.click(screen.getByRole('button', { name: /sair da conta/i }))
    expect(mockLogout).toHaveBeenCalled()
  })
})

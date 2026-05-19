// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAdminTenants } from '@/hooks/useAdminTenants'

vi.mock('@/lib/api', () => ({
  api: {
    admin: {
      tenants: {
        listar:         vi.fn(),
        resumo:         vi.fn(),
        atualizar:      vi.fn(),
        criar:          vi.fn(),
        deletar:        vi.fn(),
        estenderTrial:  vi.fn(),
        listarUsuarios: vi.fn(),
        removerUsuario: vi.fn(),
      },
    },
  },
  toErrorMessage: (_e: unknown, fallback = 'Erro') => String(fallback),
}))

// useAuth mockado como vi.fn() para permitir override por teste
// vi.hoisted() garante que a variável existe antes da execução do vi.mock hoisted
const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }))

// router estável para evitar re-execução do useEffect a cada render
const stableRouter = { push: vi.fn(), replace: vi.fn() }
vi.mock('next/navigation', () => ({
  useRouter:       () => stableRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname:     () => '/',
}))

const TENANT_TRIAL: Record<string, unknown> = {
  id: 1, nome: 'Fazenda Verde', email: 'fazenda@test.com',
  plano: 'BASICO', status: 'TRIAL',
  trialExpira: '2026-06-01T00:00:00Z', assinaturaExpira: null,
  criadoEm: '2026-01-01T00:00:00Z',
  usuarioAdminNome: 'João Silva', usuarioAdminEmail: 'joao@fazenda.com',
  adminRole: 'ADMIN_TENANT', totalExperimentos: 5, totalUsuarios: 2,
}
const TENANT_ATIVO: Record<string, unknown> = {
  id: 2, nome: 'Cogumelos SP', email: 'sp@test.com',
  plano: 'PRO', status: 'ATIVO',
  trialExpira: null, assinaturaExpira: '2027-01-01T00:00:00Z',
  criadoEm: '2025-06-01T00:00:00Z',
  usuarioAdminNome: 'Maria Souza', usuarioAdminEmail: 'maria@sp.com',
  adminRole: 'ADMIN_TENANT', totalExperimentos: 20, totalUsuarios: 5,
}
const RESUMO = { total: 2, emTrial: 1, ativos: 1, expirados: 0, expira3dias: 0 }

describe('useAdminTenants', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let apiMock: any

  beforeEach(async () => {
    vi.clearAllMocks()
    stableRouter.push.mockReset()
    stableRouter.replace.mockReset()
    mockUseAuth.mockReturnValue({ isAdmin: true, user: null, login: vi.fn(), logout: vi.fn(), loading: false })
    const mod = await import('@/lib/api')
    apiMock = mod.api
    apiMock.admin.tenants.listar.mockResolvedValue([TENANT_TRIAL, TENANT_ATIVO])
    apiMock.admin.tenants.resumo.mockResolvedValue(RESUMO)
  })

  // ── Carregamento inicial ──────────────────────────────────────────────────────
  it('carrega tenants e resumo no mount quando isAdmin=true', async () => {
    const { result } = renderHook(() => useAdminTenants())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tenants).toHaveLength(2)
    expect(result.current.resumo.total).toBe(2)
    expect(result.current.resumo.emTrial).toBe(1)
    expect(apiMock.admin.tenants.listar).toHaveBeenCalledOnce()
    expect(apiMock.admin.tenants.resumo).toHaveBeenCalledOnce()
  })

  it('redireciona para / quando isAdmin=false', async () => {
    mockUseAuth.mockReturnValue({ isAdmin: false, user: null, login: vi.fn(), logout: vi.fn(), loading: false })
    renderHook(() => useAdminTenants())
    await waitFor(() => expect(stableRouter.push).toHaveBeenCalledWith('/'))
  })

  // ── filtrados ─────────────────────────────────────────────────────────────────
  it('filtrados filtra por busca (nome)', async () => {
    const { result } = renderHook(() => useAdminTenants())
    await waitFor(() => expect(result.current.tenants).toHaveLength(2))
    act(() => result.current.setBusca('fazenda'))
    expect(result.current.filtrados).toHaveLength(1)
    expect(result.current.filtrados[0].nome).toBe('Fazenda Verde')
  })

  it('filtrados filtra por status', async () => {
    const { result } = renderHook(() => useAdminTenants())
    await waitFor(() => expect(result.current.tenants).toHaveLength(2))
    act(() => result.current.setFiltroStatus('TRIAL'))
    expect(result.current.filtrados).toHaveLength(1)
    expect(result.current.filtrados[0].status).toBe('TRIAL')
  })

  it('filtrados retorna todos quando busca e status são padrão', async () => {
    const { result } = renderHook(() => useAdminTenants())
    await waitFor(() => expect(result.current.tenants).toHaveLength(2))
    expect(result.current.filtrados).toHaveLength(2)
  })

  // ── abrirEditar ───────────────────────────────────────────────────────────────
  it('abrirEditar popula formEdicao com dados do tenant e abre modal', async () => {
    const { result } = renderHook(() => useAdminTenants())
    await waitFor(() => expect(result.current.tenants).toHaveLength(2))
    act(() => result.current.abrirEditar(TENANT_TRIAL as never))
    expect(result.current.showModal).toBe(true)
    expect(result.current.editando?.id).toBe(1)
    expect(result.current.formEdicao.nome).toBe('Fazenda Verde')
    expect(result.current.formEdicao.plano).toBe('BASICO')
    expect(result.current.formEdicao.status).toBe('TRIAL')
  })

  // ── salvar ────────────────────────────────────────────────────────────────────
  it('salvar chama api.admin.tenants.atualizar e fecha modal', async () => {
    apiMock.admin.tenants.atualizar.mockResolvedValue(TENANT_TRIAL)
    const { result } = renderHook(() => useAdminTenants())
    await waitFor(() => expect(result.current.tenants).toHaveLength(2))
    act(() => result.current.abrirEditar(TENANT_TRIAL as never))
    await act(async () => { await result.current.salvar() })
    expect(apiMock.admin.tenants.atualizar).toHaveBeenCalledWith(1, expect.any(Object))
    expect(result.current.showModal).toBe(false)
  })

  it('salvar registra erro quando api falha e modal permanece aberto', async () => {
    apiMock.admin.tenants.atualizar.mockRejectedValue(new Error('server error'))
    const { result } = renderHook(() => useAdminTenants())
    await waitFor(() => expect(result.current.tenants).toHaveLength(2))
    act(() => result.current.abrirEditar(TENANT_TRIAL as never))
    await act(async () => { await result.current.salvar() })
    expect(result.current.erro).toBeTruthy()
    expect(result.current.showModal).toBe(true)
  })

  // ── criarTenant ───────────────────────────────────────────────────────────────
  it('criarTenant chama api.admin.tenants.criar e fecha modal', async () => {
    apiMock.admin.tenants.criar.mockResolvedValue(TENANT_TRIAL)
    const { result } = renderHook(() => useAdminTenants())
    await waitFor(() => expect(result.current.tenants).toHaveLength(2))
    act(() => result.current.setFormNovo({
      nome: 'Nova Empresa', email: 'nova@test.com',
      adminNome: 'Admin', adminEmail: 'admin@nova.com',
      adminSenha: 'senha123', plano: 'BASICO',
    }))
    await act(async () => { await result.current.criarTenant() })
    expect(apiMock.admin.tenants.criar).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Nova Empresa', email: 'nova@test.com' })
    )
    expect(result.current.showNovo).toBe(false)
  })

  // ── estenderTrial ─────────────────────────────────────────────────────────────
  it('estenderTrial chama api com 14 dias e recarrega dados', async () => {
    apiMock.admin.tenants.estenderTrial.mockResolvedValue(undefined)
    const { result } = renderHook(() => useAdminTenants())
    await waitFor(() => expect(result.current.tenants).toHaveLength(2))
    const callsAntesDe = apiMock.admin.tenants.listar.mock.calls.length
    await act(async () => { await result.current.estenderTrial(1) })
    expect(apiMock.admin.tenants.estenderTrial).toHaveBeenCalledWith(1, 14)
    expect(apiMock.admin.tenants.listar.mock.calls.length).toBe(callsAntesDe + 1)
  })
})

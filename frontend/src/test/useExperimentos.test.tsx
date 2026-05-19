// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useExperimentos } from '@/hooks/useExperimentos'

vi.mock('@/lib/api', () => ({
  api: {
    experimentos: {
      listar:         vi.fn(),
      codigoSugestao: vi.fn(),
      criar:          vi.fn(),
      avancar:        vi.fn(),
      deletar:        vi.fn(),
      resumoDelete:   vi.fn(),
      salvarCustos:   vi.fn(),
      monitoramentos: { listar: vi.fn(), criar: vi.fn() },
      colheitas:      { listar: vi.fn(), criar: vi.fn() },
    },
    formulacoes: { listar: vi.fn() },
  },
  toErrorMessage: (_e: unknown, fallback = 'Erro') => String(fallback),
}))

const EXP_ATIVO = {
  id: 'e1', codigo: 'EXP-001', status: 'INOCULADO',
  especieNome: 'Shiitake', formulacaoNome: 'Form A', formulacaoId: 'f1',
  totalBlocos: 40, blocosPerdidos: 0, cicloAtual: 1, precoVendaKg: 35,
  dataPreparo: '2026-01-01', pesoBlocoKg: 1.2,
  financeiro: { totalColhidoKg: 0, receitaTotal: 0, margemPct: null, custoTotalSubstrato: 200 },
  insumos: [], custos: [],
}
const EXP_CONCLUIDO = {
  id: 'e2', codigo: 'EXP-002', status: 'CONCLUIDO',
  especieNome: 'Oyster', formulacaoNome: 'Form B', formulacaoId: 'f2',
  totalBlocos: 20, blocosPerdidos: 2, cicloAtual: 2, precoVendaKg: 40,
  dataPreparo: '2025-11-01', pesoBlocoKg: 1.0,
  financeiro: { totalColhidoKg: 15, receitaTotal: 600, margemPct: 30, custoTotalSubstrato: 420 },
  insumos: [], custos: [],
}
const FORMULACAO = { id: 'f1', nome: 'Form A', especieNome: 'Shiitake', status: 'ATIVA' }

describe('useExperimentos', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let apiMock: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/lib/api')
    apiMock = mod.api
    apiMock.experimentos.listar.mockResolvedValue([EXP_ATIVO, EXP_CONCLUIDO])
    apiMock.formulacoes.listar.mockResolvedValue([FORMULACAO])
    apiMock.experimentos.codigoSugestao.mockResolvedValue({ codigo: 'EXP-003' })
  })

  // ── Carregamento inicial ──────────────────────────────────────────────────────
  it('carrega experimentos e formulações no mount', async () => {
    const { result } = renderHook(() => useExperimentos())
    await waitFor(() => expect(result.current.experimentos).toHaveLength(2))
    expect(result.current.formulacoes).toHaveLength(1)
    expect(apiMock.experimentos.listar).toHaveBeenCalledOnce()
    expect(apiMock.formulacoes.listar).toHaveBeenCalledOnce()
  })

  it('registra erroPage quando carregamento de experimentos falha', async () => {
    apiMock.experimentos.listar.mockResolvedValue(Promise.reject(new Error('offline')))
    const { result } = renderHook(() => useExperimentos())
    await waitFor(() => expect(result.current.erroPage).toBeTruthy())
  })

  // ── Estatísticas (useMemo) ────────────────────────────────────────────────────
  it('calcula ativos excluindo CONCLUIDO', async () => {
    const { result } = renderHook(() => useExperimentos())
    await waitFor(() => expect(result.current.experimentos).toHaveLength(2))
    expect(result.current.ativos).toBe(1)
  })

  it('calcula totalColhido somando financeiro dos experimentos', async () => {
    const { result } = renderHook(() => useExperimentos())
    await waitFor(() => expect(result.current.experimentos).toHaveLength(2))
    expect(result.current.totalColhido).toBe(15)
  })

  it('calcula receitaTotal somando financeiro dos experimentos', async () => {
    const { result } = renderHook(() => useExperimentos())
    await waitFor(() => expect(result.current.experimentos).toHaveLength(2))
    expect(result.current.receitaTotal).toBe(600)
  })

  it('calcula margemMedia apenas dos experimentos com margemPct', async () => {
    const { result } = renderHook(() => useExperimentos())
    await waitFor(() => expect(result.current.experimentos).toHaveLength(2))
    expect(result.current.margemMedia).toBe(30) // só EXP_CONCLUIDO tem margemPct
  })

  // ── abrirDetalhe ─────────────────────────────────────────────────────────────
  it('abrirDetalhe carrega monitoramentos e colheitas e abre modal', async () => {
    apiMock.experimentos.monitoramentos.listar.mockResolvedValue([])
    apiMock.experimentos.colheitas.listar.mockResolvedValue([])
    const { result } = renderHook(() => useExperimentos())
    await waitFor(() => expect(result.current.experimentos).toHaveLength(2))
    await act(async () => { await result.current.abrirDetalhe(EXP_ATIVO as never) })
    expect(result.current.modalAberto).toBe(true)
    expect(result.current.selected?.id).toBe('e1')
    expect(apiMock.experimentos.monitoramentos.listar).toHaveBeenCalledWith('e1')
    expect(apiMock.experimentos.colheitas.listar).toHaveBeenCalledWith('e1')
  })

  it('abrirDetalhe define erroPage e selected=null quando api falha', async () => {
    apiMock.experimentos.monitoramentos.listar.mockRejectedValue(new Error('fail'))
    apiMock.experimentos.colheitas.listar.mockResolvedValue([])
    const { result } = renderHook(() => useExperimentos())
    await waitFor(() => expect(result.current.experimentos).toHaveLength(2))
    await act(async () => { await result.current.abrirDetalhe(EXP_ATIVO as never) })
    expect(result.current.selected).toBeNull()
    expect(result.current.erroPage).toBeTruthy()
  })

  // ── fecharModal ───────────────────────────────────────────────────────────────
  it('fecharModal limpa selected e fecha modal', async () => {
    apiMock.experimentos.monitoramentos.listar.mockResolvedValue([])
    apiMock.experimentos.colheitas.listar.mockResolvedValue([])
    const { result } = renderHook(() => useExperimentos())
    await waitFor(() => expect(result.current.experimentos).toHaveLength(2))
    await act(async () => { await result.current.abrirDetalhe(EXP_ATIVO as never) })
    expect(result.current.modalAberto).toBe(true)
    act(() => result.current.fecharModal())
    expect(result.current.modalAberto).toBe(false)
    expect(result.current.selected).toBeNull()
  })

  // ── criar ─────────────────────────────────────────────────────────────────────
  // Validação e erroCreate foram movidos para NovoExpForm (único consumidor).
  // O hook recebe dados já validados e propaga erros via reject.

  it('criar chama api.experimentos.criar com dados corretos', async () => {
    apiMock.experimentos.criar.mockResolvedValue(EXP_ATIVO)
    const { result } = renderHook(() => useExperimentos())
    await waitFor(() => expect(result.current.formulacoes).toHaveLength(1))
    await act(async () => {
      await result.current.criar({ formulacaoId: 'f1', codigo: 'EXP-003', dataPreparo: '2026-05-01', totalBlocos: 40, pesoBlocoKg: 1.2 })
    })
    expect(apiMock.experimentos.criar).toHaveBeenCalledWith(
      expect.objectContaining({ codigo: 'EXP-003', dataPreparo: '2026-05-01' })
    )
  })

  it('criar propaga erro quando api falha', async () => {
    apiMock.experimentos.criar.mockRejectedValue(new Error('network error'))
    const { result } = renderHook(() => useExperimentos())
    await waitFor(() => expect(result.current.experimentos).toHaveLength(2))
    let threw = false
    await act(async () => {
      try {
        await result.current.criar({ formulacaoId: 'f1', codigo: 'EXP-003', dataPreparo: '2026-05-01', totalBlocos: 40, pesoBlocoKg: 1.2 })
      } catch {
        threw = true
      }
    })
    expect(threw).toBe(true)
    expect(apiMock.experimentos.criar).toHaveBeenCalled()
  })

  // ── deletar ───────────────────────────────────────────────────────────────────
  it('deletar chama api e atualiza lista de experimentos', async () => {
    apiMock.experimentos.monitoramentos.listar.mockResolvedValue([])
    apiMock.experimentos.colheitas.listar.mockResolvedValue([])
    apiMock.experimentos.deletar.mockResolvedValue(undefined)
    apiMock.experimentos.listar
      .mockResolvedValueOnce([EXP_ATIVO, EXP_CONCLUIDO])  // mount
      .mockResolvedValueOnce([EXP_CONCLUIDO])               // após deletar
    const { result } = renderHook(() => useExperimentos())
    await waitFor(() => expect(result.current.experimentos).toHaveLength(2))
    await act(async () => { await result.current.abrirDetalhe(EXP_ATIVO as never) })
    await act(async () => { await result.current.deletar() })
    expect(apiMock.experimentos.deletar).toHaveBeenCalledWith('e1')
    expect(result.current.modalAberto).toBe(false)
  })
})

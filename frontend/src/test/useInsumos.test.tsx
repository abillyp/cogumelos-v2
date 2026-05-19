// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useInsumos } from '@/hooks/useInsumos'

vi.mock('@/lib/api', () => ({
  api: {
    insumos: {
      listar:     vi.fn(),
      categorias: vi.fn(),
      criar:      vi.fn(),
      atualizar:  vi.fn(),
      deletar:    vi.fn(),
    },
  },
  toErrorMessage: (_e: unknown, fallback = 'Erro') => String(fallback),
}))

const INSUMO_1 = { id: '1', nome: 'Palha de trigo',  moPct: 85, carbonoPct: 46.2, nitrogenioPct: 0.5, ph: 6.5,  categoria: 'Palha'  }
const INSUMO_2 = { id: '2', nome: 'Farelo de arroz', moPct: 90, carbonoPct: 42.0, nitrogenioPct: 2.1, ph: null, categoria: 'Farelo' }
const CATEGORIAS = ['Palha', 'Farelo']

describe('useInsumos', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let apiMock: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/lib/api')
    apiMock = mod.api
    apiMock.insumos.listar.mockResolvedValue([INSUMO_1, INSUMO_2])
    apiMock.insumos.categorias.mockResolvedValue(CATEGORIAS)
  })

  // ── Carregamento inicial ──────────────────────────────────────────────────────
  it('carrega insumos e categorias no mount', async () => {
    const { result } = renderHook(() => useInsumos())
    await waitFor(() => expect(result.current.insumos).toHaveLength(2))
    expect(result.current.categorias).toEqual(CATEGORIAS)
    expect(apiMock.insumos.listar).toHaveBeenCalledOnce()
    expect(apiMock.insumos.categorias).toHaveBeenCalledOnce()
  })

  it('exibe erro quando api falha no carregamento', async () => {
    apiMock.insumos.listar.mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useInsumos())
    await waitFor(() => expect(result.current.erro).toBeTruthy())
  })

  // ── filtrados e todasCats ─────────────────────────────────────────────────────
  it('todasCats inclui "Todos" seguido das categorias', async () => {
    const { result } = renderHook(() => useInsumos())
    await waitFor(() => expect(result.current.insumos).toHaveLength(2))
    expect(result.current.todasCats).toEqual(['Todos', 'Palha', 'Farelo'])
  })

  it('filtrados filtra por categoria', async () => {
    const { result } = renderHook(() => useInsumos())
    await waitFor(() => expect(result.current.insumos).toHaveLength(2))
    act(() => result.current.setFiltro('Palha'))
    expect(result.current.filtrados).toHaveLength(1)
    expect(result.current.filtrados[0].nome).toBe('Palha de trigo')
  })

  it('filtrados filtra por busca (case insensitive)', async () => {
    const { result } = renderHook(() => useInsumos())
    await waitFor(() => expect(result.current.insumos).toHaveLength(2))
    act(() => result.current.setBusca('FARELO'))
    expect(result.current.filtrados).toHaveLength(1)
    expect(result.current.filtrados[0].id).toBe('2')
  })

  // ── abrirNovo ─────────────────────────────────────────────────────────────────
  it('abrirNovo abre modal com form vazio e editando=null', async () => {
    const { result } = renderHook(() => useInsumos())
    await waitFor(() => expect(result.current.insumos).toHaveLength(2))
    act(() => result.current.abrirNovo())
    expect(result.current.modal).toBe(true)
    expect(result.current.editando).toBeNull()
    expect(result.current.form.nome).toBe('')
  })

  // ── abrirEditar ───────────────────────────────────────────────────────────────
  it('abrirEditar popula form com dados do insumo', async () => {
    const { result } = renderHook(() => useInsumos())
    await waitFor(() => expect(result.current.insumos).toHaveLength(2))
    act(() => result.current.abrirEditar(INSUMO_1 as Parameters<typeof result.current.abrirEditar>[0]))
    expect(result.current.modal).toBe(true)
    expect(result.current.editando?.id).toBe('1')
    expect(result.current.form.nome).toBe('Palha de trigo')
    expect(result.current.form.carbonoPct).toBe('46.2')
  })

  // ── salvar ────────────────────────────────────────────────────────────────────
  it('salvar chama api.insumos.criar quando não há editando', async () => {
    apiMock.insumos.criar.mockResolvedValue({ ...INSUMO_1, id: '3' })
    const { result } = renderHook(() => useInsumos())
    await waitFor(() => expect(result.current.insumos).toHaveLength(2))
    act(() => result.current.abrirNovo())
    act(() => result.current.setForm({
      nome: 'Novo', moPct: '80', carbonoPct: '45', nitrogenioPct: '1', ph: '', categoria: 'Palha',
    }))
    await act(async () => { await result.current.salvar() })
    expect(apiMock.insumos.criar).toHaveBeenCalledOnce()
    expect(apiMock.insumos.atualizar).not.toHaveBeenCalled()
  })

  it('salvar chama api.insumos.atualizar quando há editando', async () => {
    apiMock.insumos.atualizar.mockResolvedValue(INSUMO_1)
    const { result } = renderHook(() => useInsumos())
    await waitFor(() => expect(result.current.insumos).toHaveLength(2))
    act(() => result.current.abrirEditar(INSUMO_1 as Parameters<typeof result.current.abrirEditar>[0]))
    await act(async () => { await result.current.salvar() })
    expect(apiMock.insumos.atualizar).toHaveBeenCalledWith('1', expect.any(Object))
    expect(apiMock.insumos.criar).not.toHaveBeenCalled()
  })

  // ── deletar ───────────────────────────────────────────────────────────────────
  it('deletar remove insumo da lista localmente após sucesso', async () => {
    apiMock.insumos.deletar.mockResolvedValue(undefined)
    const { result } = renderHook(() => useInsumos())
    await waitFor(() => expect(result.current.insumos).toHaveLength(2))
    await act(async () => { await result.current.deletar('1') })
    expect(result.current.insumos).toHaveLength(1)
    expect(result.current.insumos[0].id).toBe('2')
  })

  it('deletar exibe erroDeletar quando api falha', async () => {
    apiMock.insumos.deletar.mockRejectedValue(new Error('forbidden'))
    const { result } = renderHook(() => useInsumos())
    await waitFor(() => expect(result.current.insumos).toHaveLength(2))
    await act(async () => { await result.current.deletar('1') })
    expect(result.current.erroDeletar).toBeTruthy()
    expect(result.current.insumos).toHaveLength(2) // lista não alterada
  })
})
